import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import * as SQLite from 'expo-sqlite';

const ListsContext = createContext({});

// Abrir conexão com o banco de dados SQLite
const db = SQLite.openDatabase('smartlist.db');

export const ListsProvider = ({ children }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'
  const { user, isAuthenticated } = useAuth();

  // Inicializar banco de dados local
  useEffect(() => {
    const initDatabase = async () => {
      // Criar tabelas se não existirem
      db.transaction(tx => {
        // Tabela de listas
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            is_synced INTEGER DEFAULT 0,
            user_id TEXT,
            is_deleted INTEGER DEFAULT 0
          )`,
          [],
          () => console.log('Tabela de listas criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de listas:', error)
        );

        // Tabela de itens da lista
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS list_items (
            id TEXT PRIMARY KEY,
            list_id TEXT NOT NULL,
            product_id TEXT,
            name TEXT NOT NULL,
            quantity REAL DEFAULT 1,
            unit TEXT,
            price REAL,
            category TEXT,
            is_checked INTEGER DEFAULT 0,
            note TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            is_synced INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
          )`,
          [],
          () => console.log('Tabela de itens criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de itens:', error)
        );
      });
    };

    initDatabase();
  }, []);

  // Carregar listas do banco local
  useEffect(() => {
    const loadLocalLists = async () => {
      try {
        setLoading(true);
        
        // Buscar listas do SQLite
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM lists WHERE is_deleted = 0 ORDER BY updated_at DESC`,
            [],
            (_, { rows }) => {
              const localLists = rows._array.map(list => ({
                ...list,
                items: [] // Será preenchido depois
              }));
              
              // Para cada lista, buscar seus itens
              if (localLists.length > 0) {
                localLists.forEach((list, index) => {
                  tx.executeSql(
                    `SELECT * FROM list_items WHERE list_id = ? AND is_deleted = 0`,
                    [list.id],
                    (_, { rows: itemRows }) => {
                      localLists[index].items = itemRows._array;
                      
                      // Se for a última lista, atualizar o estado
                      if (index === localLists.length - 1) {
                        setLists(localLists);
                        setLoading(false);
                      }
                    },
                    (_, error) => {
                      console.error('Erro ao buscar itens da lista:', error);
                      setLoading(false);
                    }
                  );
                });
              } else {
                setLists([]);
                setLoading(false);
              }
            },
            (_, error) => {
              console.error('Erro ao buscar listas locais:', error);
              setLoading(false);
            }
          );
        });
      } catch (error) {
        console.error('Erro ao carregar listas locais:', error);
        setLoading(false);
      }
    };

    loadLocalLists();
  }, []);

  // Sincronizar com Firestore quando usuário estiver autenticado
  useEffect(() => {
    let unsubscribe = () => {};
    
    const syncWithFirestore = async () => {
      if (!isAuthenticated || !user?.uid) return;
      
      try {
        setSyncStatus('syncing');
        
        // Primeiro, enviar listas locais não sincronizadas para o Firestore
        await syncLocalToFirestore();
        
        // Depois, configurar listener para mudanças no Firestore
        unsubscribe = firestore()
          .collection('lists')
          .where('userId', '==', user.uid)
          .where('isDeleted', '==', false)
          .orderBy('updatedAt', 'desc')
          .onSnapshot(
            async (snapshot) => {
              // Processar mudanças do Firestore
              const firestoreLists = [];
              
              for (const doc of snapshot.docs) {
                const listData = {
                  id: doc.id,
                  ...doc.data(),
                  items: []
                };
                
                // Buscar itens da lista
                const itemsSnapshot = await firestore()
                  .collection('lists')
                  .doc(doc.id)
                  .collection('items')
                  .where('isDeleted', '==', false)
                  .get();
                
                listData.items = itemsSnapshot.docs.map(itemDoc => ({
                  id: itemDoc.id,
                  ...itemDoc.data()
                }));
                
                firestoreLists.push(listData);
              }
              
              // Atualizar banco local com dados do Firestore
              await updateLocalFromFirestore(firestoreLists);
              
              // Recarregar listas do banco local
              await loadLocalLists();
              
              setSyncStatus('synced');
            },
            (error) => {
              console.error('Erro ao sincronizar com Firestore:', error);
              setSyncStatus('offline');
            }
          );
      } catch (error) {
        console.error('Erro ao configurar sincronização:', error);
        setSyncStatus('offline');
      }
    };
    
    syncWithFirestore();
    
    return () => unsubscribe();
  }, [isAuthenticated, user]);

  // Função para carregar listas locais
  const loadLocalLists = () => {
    return new Promise((resolve, reject) => {
      try {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM lists WHERE is_deleted = 0 ORDER BY updated_at DESC`,
            [],
            (_, { rows }) => {
              const localLists = rows._array.map(list => ({
                ...list,
                items: [] // Será preenchido depois
              }));
              
              // Para cada lista, buscar seus itens
              if (localLists.length > 0) {
                let completedLists = 0;
                
                localLists.forEach((list, index) => {
                  tx.executeSql(
                    `SELECT * FROM list_items WHERE list_id = ? AND is_deleted = 0`,
                    [list.id],
                    (_, { rows: itemRows }) => {
                      localLists[index].items = itemRows._array;
                      completedLists++;
                      
                      // Se todas as listas foram processadas
                      if (completedLists === localLists.length) {
                        setLists(localLists);
                        resolve(localLists);
                      }
                    },
                    (_, error) => {
                      console.error('Erro ao buscar itens da lista:', error);
                      reject(error);
                    }
                  );
                });
              } else {
                setLists([]);
                resolve([]);
              }
            },
            (_, error) => {
              console.error('Erro ao buscar listas locais:', error);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Erro ao carregar listas locais:', error);
        reject(error);
      }
    });
  };

  // Sincronizar listas locais para o Firestore
  const syncLocalToFirestore = async () => {
    if (!isAuthenticated || !user?.uid) return;
    
    try {
      // Buscar listas não sincronizadas
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM lists WHERE is_synced = 0 AND user_id = ?`,
            [user.uid],
            async (_, { rows }) => {
              const unsyncedLists = rows._array;
              
              for (const list of unsyncedLists) {
                // Verificar se a lista foi excluída localmente
                if (list.is_deleted) {
                  // Se já existe no Firestore, marcar como excluída
                  if (list.id.startsWith('fs_')) {
                    await firestore()
                      .collection('lists')
                      .doc(list.id.replace('fs_', ''))
                      .update({
                        isDeleted: true,
                        updatedAt: firestore.FieldValue.serverTimestamp()
                      });
                  }
                  // Se é apenas local, não precisa fazer nada no Firestore
                } else {
                  // Preparar dados para o Firestore
                  const firestoreData = {
                    name: list.name,
                    description: list.description || '',
                    userId: user.uid,
                    createdAt: new Date(list.created_at),
                    updatedAt: new Date(list.updated_at),
                    isDeleted: false
                  };
                  
                  let firestoreListId;
                  
                  // Se já existe no Firestore, atualizar
                  if (list.id.startsWith('fs_')) {
                    firestoreListId = list.id.replace('fs_', '');
                    await firestore()
                      .collection('lists')
                      .doc(firestoreListId)
                      .update(firestoreData);
                  } else {
                    // Se é nova, criar no Firestore
                    const docRef = await firestore()
                      .collection('lists')
                      .add(firestoreData);
                    
                    firestoreListId = docRef.id;
                    
                    // Atualizar ID local para referenciar o Firestore
                    const newId = `fs_${firestoreListId}`;
                    await new Promise((resolveUpdate, rejectUpdate) => {
                      tx.executeSql(
                        `UPDATE lists SET id = ?, is_synced = 1 WHERE id = ?`,
                        [newId, list.id],
                        resolveUpdate,
                        (_, error) => rejectUpdate(error)
                      );
                    });
                    
                    // Atualizar referências nos itens
                    await new Promise((resolveUpdate, rejectUpdate) => {
                      tx.executeSql(
                        `UPDATE list_items SET list_id = ? WHERE list_id = ?`,
                        [newId, list.id],
                        resolveUpdate,
                        (_, error) => rejectUpdate(error)
                      );
                    });
                  }
                  
                  // Sincronizar itens da lista
                  await syncListItemsToFirestore(tx, list.id, firestoreListId);
                }
                
                // Marcar lista como sincronizada
                await new Promise((resolveUpdate, rejectUpdate) => {
                  tx.executeSql(
                    `UPDATE lists SET is_synced = 1 WHERE id = ?`,
                    [list.id],
                    resolveUpdate,
                    (_, error) => rejectUpdate(error)
                  );
                });
              }
              
              resolve();
            },
            (_, error) => {
              console.error('Erro ao buscar listas não sincronizadas:', error);
              reject(error);
            }
          );
        });
      });
    } catch (error) {
      console.error('Erro ao sincronizar com Firestore:', error);
      throw error;
    }
  };

  // Sincronizar itens de uma lista para o Firestore
  const syncListItemsToFirestore = async (tx, localListId, firestoreListId) => {
    return new Promise((resolve, reject) => {
      tx.executeSql(
        `SELECT * FROM list_items WHERE list_id = ? AND is_synced = 0`,
        [localListId],
        async (_, { rows }) => {
          const unsyncedItems = rows._array;
          
          for (const item of unsyncedItems) {
            // Preparar dados para o Firestore
            const firestoreData = {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit || 'un',
              price: item.price || null,
              category: item.category || null,
              isChecked: item.is_checked === 1,
              note: item.note || '',
              productId: item.product_id || null,
              createdAt: new Date(item.created_at),
              updatedAt: new Date(item.updated_at),
              isDeleted: item.is_deleted === 1
            };
            
            // Verificar se o item foi excluído localmente
            if (item.is_deleted) {
              // Se já existe no Firestore, marcar como excluído
              if (item.id.startsWith('fs_')) {
                await firestore()
                  .collection('lists')
                  .doc(firestoreListId)
                  .collection('items')
                  .doc(item.id.replace('fs_', ''))
                  .update({
                    isDeleted: true,
                    updatedAt: firestore.FieldValue.serverTimestamp()
                  });
              }
              // Se é apenas local, não precisa fazer nada no Firestore
            } else {
              // Se já existe no Firestore, atualizar
              if (item.id.startsWith('fs_')) {
                await firestore()
                  .collection('lists')
                  .doc(firestoreListId)
                  .collection('items')
                  .doc(item.id.replace('fs_', ''))
                  .update(firestoreData);
              } else {
                // Se é novo, criar no Firestore
                const itemDocRef = await firestore()
                  .collection('lists')
                  .doc(firestoreListId)
                  .collection('items')
                  .add(firestoreData);
                
                // Atualizar ID local para referenciar o Firestore
                const newItemId = `fs_${itemDocRef.id}`;
                await new Promise((resolveUpdate, rejectUpdate) => {
                  tx.executeSql(
                    `UPDATE list_items SET id = ?, is_synced = 1 WHERE id = ?`,
                    [newItemId, item.id],
                    resolveUpdate,
                    (_, error) => rejectUpdate(error)
                  );
                });
              }
            }
            
            // Marcar item como sincronizado
            await new Promise((resolveUpdate, rejectUpdate) => {
              tx.executeSql(
                `UPDATE list_items SET is_synced = 1 WHERE id = ?`,
                [item.id],
                resolveUpdate,
                (_, error) => rejectUpdate(error)
              );
            });
          }
          
          resolve();
        },
        (_, error) => {
          console.error('Erro ao buscar itens não sincronizados:', error);
          reject(error);
        }
      );
    });
  };

  // Atualizar banco local com dados do Firestore
  const updateLocalFromFirestore = async (firestoreLists) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        // Para cada lista do Firestore
        const processLists = async () => {
          for (const list of firestoreLists) {
            const localId = `fs_${list.id}`;
            
            // Verificar se a lista já existe localmente
            const existsResult = await new Promise((resolveQuery, rejectQuery) => {
              tx.executeSql(
                `SELECT * FROM lists WHERE id = ?`,
                [localId],
                (_, { rows }) => resolveQuery(rows.length > 0),
                (_, error) => rejectQuery(error)
              );
            });
            
            if (existsResult) {
              // Atualizar lista existente
              await new Promise((resolveUpdate, rejectUpdate) => {
                tx.executeSql(
                  `UPDATE lists SET 
                    name = ?, 
                    description = ?, 
                    updated_at = ?, 
                    is_synced = 1, 
                    user_id = ?, 
                    is_deleted = ?
                  WHERE id = ?`,
                  [
                    list.name,
                    list.description || '',
                    list.updatedAt.getTime(),
                    list.userId,
                    list.isDeleted ? 1 : 0,
                    localId
                  ],
                  resolveUpdate,
                  (_, error) => rejectUpdate(error)
                );
              });
            } else {
              // Inserir nova lista
              await new Promise((resolveInsert, rejectInsert) => {
                tx.executeSql(
                  `INSERT INTO lists (
                    id, name, description, created_at, updated_at, is_synced, user_id, is_deleted
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    localId,
                    list.name,
                    list.description || '',
                    list.createdAt.getTime(),
                    list.updatedAt.getTime(),
                    1, // já está sincronizada
                    list.userId,
                    list.isDeleted ? 1 : 0
                  ],
                  resolveInsert,
                  (_, error) => rejectInsert(error)
                );
              });
            }
            
            // Processar itens da lista
            for (const item of list.items) {
              const localItemId = `fs_${item.id}`;
              
              // Verificar se o item já existe localmente
              const itemExistsResult = await new Promise((resolveQuery, rejectQuery) => {
                tx.executeSql(
                  `SELECT * FROM list_items WHERE id = ?`,
                  [localItemId],
                  (_, { rows }) => resolveQuery(rows.length > 0),
                  (_, error) => rejectQuery(error)
                );
              });
              
              if (itemExistsResult) {
                // Atualizar item existente
                await new Promise((resolveUpdate, rejectUpdate) => {
                  tx.executeSql(
                    `UPDATE list_items SET 
                      name = ?, 
                      quantity = ?, 
                      unit = ?, 
                      price = ?, 
                      category = ?, 
                      is_checked = ?, 
                      note = ?,