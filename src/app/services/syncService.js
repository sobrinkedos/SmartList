import NetInfo from '@react-native-community/netinfo';
import { getFirestore } from './firebase';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Abrir conexão com o banco de dados
const db = SQLite.openDatabase('smartlist.db');

/**
 * Serviço para sincronização de dados entre SQLite e Firestore
 */
export const SyncService = {
  /**
   * Verificar status da conexão com a internet
   */
  checkNetworkStatus: async () => {
    try {
      const netInfo = await NetInfo.fetch();
      return { connected: netInfo.isConnected, type: netInfo.type };
    } catch (error) {
      console.error('Erro ao verificar status da rede:', error);
      return { connected: false, error };
    }
  },

  /**
   * Sincronizar dados locais com o Firestore
   * @param {string} userId - ID do usuário
   */
  syncAllData: async (userId) => {
    try {
      // Verificar conexão
      const { connected } = await SyncService.checkNetworkStatus();
      if (!connected) {
        return { success: false, error: 'Sem conexão com a internet' };
      }

      // Sincronizar produtos
      await SyncService.syncProducts(userId);
      
      // Sincronizar listas
      await SyncService.syncLists(userId);
      
      // Sincronizar lojas
      await SyncService.syncStores(userId);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      return { success: false, error };
    }
  },

  /**
   * Sincronizar produtos com o Firestore
   * @param {string} userId - ID do usuário
   */
  syncProducts: async (userId) => {
    try {
      // 1. Obter produtos não sincronizados do SQLite
      const unsyncedProducts = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM products WHERE (is_synced = 0 OR is_deleted = 1) AND user_id = ?',
            [userId],
            (_, { rows }) => resolve(rows._array),
            (_, error) => reject(error)
          );
        });
      });

      if (unsyncedProducts.length === 0) {
        return { success: true, message: 'Nenhum produto para sincronizar' };
      }

      // 2. Enviar para o Firestore
      const db = getFirestore();
      const batch = db.batch();
      const productsRef = db.collection('products');

      for (const product of unsyncedProducts) {
        const docRef = productsRef.doc(product.id);
        
        if (product.is_deleted) {
          // Remover do Firestore
          batch.delete(docRef);
        } else {
          // Adicionar ou atualizar no Firestore
          const productData = { ...product };
          delete productData.is_synced;
          delete productData.is_deleted;
          batch.set(docRef, productData, { merge: true });
        }
      }

      await batch.commit();

      // 3. Atualizar status de sincronização no SQLite
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          // Marcar produtos como sincronizados
          tx.executeSql(
            'UPDATE products SET is_synced = 1 WHERE id IN (' + unsyncedProducts.map(() => '?').join(',') + ')',
            unsyncedProducts.map(p => p.id),
            () => {},
            (_, error) => reject(error)
          );
          
          // Remover produtos excluídos
          tx.executeSql(
            'DELETE FROM products WHERE is_deleted = 1 AND is_synced = 1',
            [],
            () => resolve(),
            (_, error) => reject(error)
          );
        });
      });

      // 4. Baixar produtos novos ou atualizados do Firestore
      const lastSync = await AsyncStorage.getItem('lastProductSync');
      const query = lastSync 
        ? productsRef.where('user_id', '==', userId).where('updated_at', '>', new Date(parseInt(lastSync)))
        : productsRef.where('user_id', '==', userId);

      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            snapshot.forEach(doc => {
              const productData = doc.data();
              
              tx.executeSql(
                `INSERT OR REPLACE INTO products (
                  id, barcode, name, description, category, image_url, 
                  created_at, updated_at, is_synced, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
                [
                  doc.id,
                  productData.barcode || null,
                  productData.name,
                  productData.description || null,
                  productData.category || null,
                  productData.image_url || null,
                  productData.created_at?.toMillis() || Date.now(),
                  productData.updated_at?.toMillis() || Date.now(),
                  userId
                ],
                () => {},
                (_, error) => reject(error)
              );
            });
            resolve();
          });
        });
      }

      // Atualizar timestamp da última sincronização
      await AsyncStorage.setItem('lastProductSync', Date.now().toString());

      return { success: true };
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error);
      return { success: false, error };
    }
  },

  /**
   * Sincronizar listas com o Firestore
   * @param {string} userId - ID do usuário
   */
  syncLists: async (userId) => {
    try {
      // 1. Obter listas não sincronizadas do SQLite
      const unsyncedLists = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM lists WHERE (is_synced = 0 OR is_deleted = 1) AND user_id = ?',
            [userId],
            (_, { rows }) => resolve(rows._array),
            (_, error) => reject(error)
          );
        });
      });

      // 2. Para cada lista, obter seus itens
      for (const list of unsyncedLists) {
        list.items = await new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              'SELECT * FROM list_items WHERE list_id = ?',
              [list.id],
              (_, { rows }) => resolve(rows._array),
              (_, error) => reject(error)
            );
          });
        });
      }

      if (unsyncedLists.length === 0) {
        return { success: true, message: 'Nenhuma lista para sincronizar' };
      }

      // 3. Enviar para o Firestore
      const db = getFirestore();
      const batch = db.batch();
      const listsRef = db.collection('lists');
      const listItemsRef = db.collection('list_items');

      for (const list of unsyncedLists) {
        const listDocRef = listsRef.doc(list.id);
        
        if (list.is_deleted) {
          // Remover lista e seus itens do Firestore
          batch.delete(listDocRef);
          
          // Também excluir todos os itens da lista
          const itemsSnapshot = await listItemsRef.where('list_id', '==', list.id).get();
          itemsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
        } else {
          // Adicionar ou atualizar lista no Firestore
          const listData = { ...list };
          delete listData.is_synced;
          delete listData.is_deleted;
          delete listData.items; // Remover itens, serão salvos separadamente
          batch.set(listDocRef, listData, { merge: true });
          
          // Adicionar ou atualizar itens da lista
          for (const item of list.items) {
            const itemDocRef = listItemsRef.doc(item.id);
            const itemData = { ...item };
            delete itemData.is_synced;
            delete itemData.is_deleted;
            batch.set(itemDocRef, itemData, { merge: true });
          }
        }
      }

      await batch.commit();

      // 4. Atualizar status de sincronização no SQLite
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          // Marcar listas como sincronizadas
          tx.executeSql(
            'UPDATE lists SET is_synced = 1 WHERE id IN (' + unsyncedLists.map(() => '?').join(',') + ')',
            unsyncedLists.map(l => l.id),
            () => {},
            (_, error) => reject(error)
          );
          
          // Marcar itens como sincronizados
          for (const list of unsyncedLists) {
            if (list.items.length > 0) {
              tx.executeSql(
                'UPDATE list_items SET is_synced = 1 WHERE id IN (' + list.items.map(() => '?').join(',') + ')',
                list.items.map(item => item.id),
                () => {},
                (_, error) => reject(error)
              );
            }
          }
          
          // Remover listas excluídas
          tx.executeSql(
            'DELETE FROM lists WHERE is_deleted = 1 AND is_synced = 1',
            [],
            () => {},
            (_, error) => reject(error)
          );
          
          // Remover itens de listas excluídas
          tx.executeSql(
            'DELETE FROM list_items WHERE list_id IN (SELECT id FROM lists WHERE is_deleted = 1)',
            [],
            () => resolve(),
            (_, error) => reject(error)
          );
        });
      });

      // 5. Baixar listas novas ou atualizadas do Firestore
      const lastSync = await AsyncStorage.getItem('lastListSync');
      const query = lastSync 
        ? listsRef.where('user_id', '==', userId).where('updated_at', '>', new Date(parseInt(lastSync)))
        : listsRef.where('user_id', '==', userId);

      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            snapshot.forEach(doc => {
              const listData = doc.data();
              
              tx.executeSql(
                `INSERT OR REPLACE INTO lists (
                  id, name, description, created_at, updated_at, is_synced, user_id
                ) VALUES (?, ?, ?, ?, ?, 1, ?)`,
                [
                  doc.id,
                  listData.name,
                  listData.description || null,
                  listData.created_at?.toMillis() || Date.now(),
                  listData.updated_at?.toMillis() || Date.now(),
                  userId
                ],
                () => {},
                (_, error) => reject(error)
              );
            });
            resolve();
          });
        });
        
        // Baixar itens das listas
        for (const doc of snapshot.docs) {
          const itemsSnapshot = await listItemsRef.where('list_id', '==', doc.id).get();
          
          if (!itemsSnapshot.empty) {
            await new Promise((resolve, reject) => {
              db.transaction(tx => {
                itemsSnapshot.forEach(itemDoc => {
                  const itemData = itemDoc.data();
                  
                  tx.executeSql(
                    `INSERT OR REPLACE INTO list_items (
                      id, list_id, product_id, name, quantity, unit, price, category,
                      is_checked, note, created_at, updated_at, is_synced
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    [
                      itemDoc.id,
                      itemData.list_id,
                      itemData.product_id || null,
                      itemData.name,
                      itemData.quantity || 1,
                      itemData.unit || null,
                      itemData.price || null,
                      itemData.category || null,
                      itemData.is_checked ? 1 : 0,
                      itemData.note || null,
                      itemData.created_at?.toMillis() || Date.now(),
                      itemData.updated_at?.toMillis() || Date.now()
                    ],
                    () => {},
                    (_, error) => reject(error)
                  );
                });
                resolve();
              });
            });
          }
        }
      }

      // Atualizar timestamp da última sincronização
      await AsyncStorage.setItem('lastListSync', Date.now().toString());

      return { success: true };
    } catch (error) {
      console.error('Erro ao sincronizar listas:', error);
      return { success: false, error };
    }
  },

  /**
   * Sincronizar lojas com o Firestore
   * @param {string} userId - ID do usuário
   */
  syncStores: async (userId) => {
    try {
      // 1. Obter lojas não sincronizadas do SQLite
      const unsyncedStores = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM stores WHERE (is_synced = 0 OR is_deleted = 1) AND user_id = ?',
            [userId],
            (_, { rows }) => resolve(rows._array),
            (_, error) => reject(error)
          );
        });
      });

      if (unsyncedStores.length === 0) {
        return { success: true, message: 'Nenhuma loja para sincronizar' };
      }

      // 2. Enviar para o Firestore
      const db = getFirestore();
      const batch = db.batch();
      const storesRef = db.collection('stores');

      for (const store of unsyncedStores) {
        const docRef = storesRef.doc(store.id);
        
        if (store.is_deleted) {
          // Remover do Firestore
          batch.delete(docRef);
        } else {
          // Adicionar ou atualizar no Firestore
          const storeData = { ...store };
          delete storeData.is_synced;
          delete storeData.is_deleted;
          batch.set(docRef, storeData, { merge: true });
        }
      }

      await batch.commit();

      // 3. Atualizar status de sincronização no SQLite
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          // Marcar lojas como sincronizadas
          tx.executeSql(
            'UPDATE stores SET is_synced = 1 WHERE id IN (' + unsyncedStores.map(() => '?').join(',') + ')',
            unsyncedStores.map(s => s.id),
            () => {},
            (_, error) => reject(error)
          );
          
          // Remover lojas excluídas
          tx.executeSql(
            'DELETE FROM stores WHERE is_deleted = 1 AND is_synced = 1',
            [],
            () => resolve(),
            (_, error) => reject(error)
          );
        });
      });

      // 4. Baixar lojas novas ou atualizadas do Firestore
      const lastSync = await AsyncStorage.getItem('lastStoreSync');
      const query = lastSync 
        ? storesRef.where('user_id', '==', userId).where('updated_at', '>', new Date(parseInt(lastSync)))
        : storesRef.where('user_id', '==', userId);

      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            snapshot.forEach(doc => {
              const storeData = doc.data();
              
              tx.executeSql(
                `INSERT OR REPLACE INTO stores (
                  id, name, address, city, state, zip_code, latitude, longitude,
                  logo_url, created_at, updated_at, is_synced, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
                [
                  doc.id,
                  storeData.name,
                  storeData.address || null,
                  storeData.city || null,
                  storeData.state || null,
                  storeData.zip_code || null,
                  storeData.latitude || null,
                  storeData.longitude || null,
                  storeData.logo_url || null,
                  storeData.created_at?.toMillis() || Date.now(),
                  storeData.updated_at?.toMillis() || Date.now(),
                  userId
                ],
                () => {},
                (_, error) => reject(error)
              );
            });
            resolve();
          });
        });
      }

      // Atualizar timestamp da última sincronização
      await AsyncStorage.setItem('lastStoreSync', Date.now().toString());

      return { success: true };
    } catch (error) {
      console.error('Erro ao sincronizar lojas:', error);
      return { success: false, error };
    }
  }(rows._array),
            (_, error