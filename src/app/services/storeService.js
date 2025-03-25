import AsyncStorage from './async-storage-mock';
import { getFirestore, syncDataWithFirestore } from './firebase';
import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

// Abrir conexão com o banco de dados
const db = SQLite.openDatabase('smartlist.db');

/**
 * Serviço para gerenciar lojas/mercados
 */
export const StoreService = {
  /**
   * Obter todas as lojas
   */
  getAllStores: () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM stores WHERE is_deleted = 0 ORDER BY name ASC',
          [],
          (_, { rows }) => {
            const stores = rows._array.map(item => ({
              ...item,
              latitude: item.latitude ? parseFloat(item.latitude) : null,
              longitude: item.longitude ? parseFloat(item.longitude) : null,
            }));
            resolve(stores);
          },
          (_, error) => {
            console.error('Erro ao obter lojas:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Obter loja por ID
   * @param {string} id - ID da loja
   */
  getStoreById: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM stores WHERE id = ? AND is_deleted = 0',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const store = rows.item(0);
              resolve({
                ...store,
                latitude: store.latitude ? parseFloat(store.latitude) : null,
                longitude: store.longitude ? parseFloat(store.longitude) : null,
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Erro ao obter loja:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Adicionar nova loja
   * @param {Object} store - Dados da loja
   */
  addStore: (store) => {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const storeId = store.id || uuidv4();
      
      const storeData = {
        id: storeId,
        name: store.name,
        address: store.address || '',
        latitude: store.latitude || null,
        longitude: store.longitude || null,
        created_at: now,
        updated_at: now,
        is_synced: 0,
        is_deleted: 0,
        user_id: store.userId || null,
      };

      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO stores (
            id, name, address, latitude, longitude, created_at, updated_at, is_synced, is_deleted, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            storeData.id, storeData.name, storeData.address, storeData.latitude, storeData.longitude,
            storeData.created_at, storeData.updated_at, storeData.is_synced, storeData.is_deleted, storeData.user_id
          ],
          (_, result) => {
            resolve({
              success: true,
              store: {
                ...store,
                id: storeId,
                created_at: now,
                updated_at: now,
              }
            });
          },
          (_, error) => {
            console.error('Erro ao adicionar loja:', error);
            reject({
              success: false,
              error: error.message || 'Erro ao adicionar loja'
            });
            return false;
          }
        );
      });
    });
  },

  /**
   * Atualizar loja existente
   * @param {Object} store - Dados da loja
   */
  updateStore: (store) => {
    return new Promise((resolve, reject) => {
      if (!store.id) {
        reject({
          success: false,
          error: 'ID da loja não fornecido'
        });
        return;
      }

      const now = Date.now();
      
      const storeData = {
        name: store.name,
        address: store.address || '',
        latitude: store.latitude || null,
        longitude: store.longitude || null,
        updated_at: now,
        is_synced: 0,
      };

      db.transaction(tx => {
        tx.executeSql(
          `UPDATE stores SET 
            name = ?, address = ?, latitude = ?, longitude = ?, updated_at = ?, is_synced = ? 
          WHERE id = ?`,
          [
            storeData.name, storeData.address, storeData.latitude, storeData.longitude,
            storeData.updated_at, storeData.is_synced, store.id
          ],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve({
                success: true,
                store: {
                  ...store,
                  updated_at: now,
                }
              });
            } else {
              reject({
                success: false,
                error: 'Loja não encontrada'
              });
            }
          },
          (_, error) => {
            console.error('Erro ao atualizar loja:', error);
            reject({
              success: false,
              error: error.message || 'Erro ao atualizar loja'
            });
            return false;
          }
        );
      });
    });
  },

  /**
   * Excluir loja
   * @param {string} id - ID da loja
   */
  deleteStore: (id) => {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      db.transaction(tx => {
        tx.executeSql(
          'UPDATE stores SET is_deleted = 1, updated_at = ?, is_synced = 0 WHERE id = ?',
          [now, id],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve({ success: true });
            } else {
              reject({
                success: false,
                error: 'Loja não encontrada'
              });
            }
          },
          (_, error) => {
            console.error('Erro ao excluir loja:', error);
            reject({
              success: false,
              error: error.message || 'Erro ao excluir loja'
            });
            return false;
          }
        );
      });
    });
  },

  /**
   * Buscar lojas por texto
   * @param {string} query - Texto para busca
   */
  searchStores: (query) => {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`;
      
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM stores 
           WHERE (name LIKE ? OR address LIKE ?) 
           AND is_deleted = 0 
           ORDER BY name ASC`,
          [searchTerm, searchTerm],
          (_, { rows }) => {
            const stores = rows._array.map(item => ({
              ...item,
              latitude: item.latitude ? parseFloat(item.latitude) : null,
              longitude: item.longitude ? parseFloat(item.longitude) : null,
            }));
            resolve(stores);
          },
          (_, error) => {
            console.error('Erro ao buscar lojas:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Sincronizar lojas com o Firestore
   */
  syncWithFirestore: async () => {
    try {
      // Obter lojas não sincronizadas
      const stores = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM stores WHERE is_synced = 0',
            [],
            (_, { rows }) => resolve(rows._array),
            (_, error) => {
              console.error('Erro ao obter lojas para sincronização:', error);
              reject(error);
              return false;
            }
          );
        });
      });

      if (stores.length === 0) {
        return { success: true, message: 'Nenhuma loja para sincronizar' };
      }

      // Sincronizar com o Firestore
      const result = await syncDataWithFirestore('stores', stores);

      if (result.success) {
        // Atualizar status de sincronização no banco local
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            stores.forEach(store => {
              tx.executeSql(
                'UPDATE stores SET is_synced = 1 WHERE id = ?',
                [store.id],
                null,
                (_, error) => {
                  console.error('Erro ao atualizar status de sincronização:', error);
                  return false;
                }
              );
            });
            resolve();
          }, reject);
        });

        return { 
          success: true, 
          message: `${stores.length} lojas sincronizadas com sucesso` 
        };
      } else {
        throw new Error(result.error || 'Erro ao sincronizar com Firestore');
      }
    } catch (error) {
      console.error('Erro na sincronização de lojas:', error);
      return { 
        success: false, 
        error: error.message || 'Erro na sincronização de lojas' 
      };
    }
  },

  /**
   * Buscar lojas próximas por coordenadas
   * @param {number} latitude - Latitude da posição atual
   * @param {number} longitude - Longitude da posição atual
   * @param {number} radius - Raio de busca em km (opcional, padrão 5km)
   */
  findNearbyStores: (latitude, longitude, radius = 5) => {
    return new Promise((resolve, reject) => {
      // Implementação simplificada - em uma aplicação real, seria necessário
      // um cálculo mais preciso de distância usando a fórmula de Haversine
      db.transaction(tx => {
        tx.executeSql(
          `SELECT *, 
           (((latitude - ?) * (latitude - ?)) + ((longitude - ?) * (longitude - ?))) AS distance 
           FROM stores 
           WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_deleted = 0 
           ORDER BY distance ASC`,
          [latitude, latitude, longitude, longitude],
          (_, { rows }) => {
            const stores = rows._array
              .map(item => ({
                ...item,
                latitude: parseFloat(item.latitude),
                longitude: parseFloat(item.longitude),
                distance: Math.sqrt(item.distance) * 111.32, // Conversão aproximada para km
              }))
              .filter(store => store.distance <= radius);
            resolve(stores);
          },
          (_, error) => {
            console.error('Erro ao buscar lojas próximas:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }
};