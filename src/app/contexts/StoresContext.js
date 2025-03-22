import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import * as SQLite from 'expo-sqlite';
import firestore from '@react-native-firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { StoreService } from '../services/storeService';

const StoresContext = createContext({});

// Abrir conexão com o banco de dados SQLite
const db = SQLite.openDatabase('smartlist.db');

export const StoresProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'
  const { user, isAuthenticated } = useAuth();

  // Carregar lojas ao iniciar
  useEffect(() => {
    loadStores();
  }, []);

  // Carregar lojas do banco de dados local
  const loadStores = async () => {
    try {
      setLoading(true);
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM stores WHERE is_deleted = 0 ORDER BY name ASC',
            [],
            (_, { rows }) => {
              const storesList = rows._array.map(item => ({
                ...item,
                latitude: item.latitude ? parseFloat(item.latitude) : null,
                longitude: item.longitude ? parseFloat(item.longitude) : null,
                created_at: item.created_at,
                updated_at: item.updated_at
              }));
              
              setStores(storesList);
              setLoading(false);
              resolve({ success: true, stores: storesList });
            },
            (_, error) => {
              console.error('Erro ao carregar lojas:', error);
              setLoading(false);
              reject({ success: false, error });
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setLoading(false);
      return { success: false, error };
    }
  };

  // Obter loja por ID
  const getStoreById = async (id) => {
    try {
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
    } catch (error) {
      console.error('Erro ao obter loja:', error);
      return null;
    }
  };

  // Adicionar nova loja
  const addStore = async (storeData) => {
    try {
      // Adicionar ID do usuário se estiver autenticado
      if (isAuthenticated && user) {
        storeData.userId = user.uid;
      }

      const now = Date.now();
      const storeId = storeData.id || uuidv4();
      
      const store = {
        id: storeId,
        name: storeData.name,
        address: storeData.address || '',
        latitude: storeData.latitude || null,
        longitude: storeData.longitude || null,
        created_at: now,
        updated_at: now,
        is_synced: 0,
        is_deleted: 0,
        user_id: storeData.userId || null,
      };

      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `INSERT INTO stores (
              id, name, address, latitude, longitude, created_at, updated_at, is_synced, is_deleted, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              store.id, store.name, store.address, store.latitude, store.longitude,
              store.created_at, store.updated_at, store.is_synced, store.is_deleted, store.user_id
            ],
            (_, result) => {
              // Atualizar lista de lojas
              setStores(prevStores => [...prevStores, store]);
              
              // Tentar sincronizar com o Firestore se estiver autenticado
              if (isAuthenticated) {
                syncWithFirestore();
              }
              
              resolve({
                success: true,
                store: {
                  ...storeData,
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
    } catch (error) {
      console.error('Erro ao adicionar loja:', error);
      return { success: false, error: error.message || 'Erro ao adicionar loja' };
    }
  };

  // Atualizar loja existente
  const updateStore = async (storeData) => {
    try {
      if (!storeData.id) {
        return {
          success: false,
          error: 'ID da loja não fornecido'
        };
      }

      const now = Date.now();
      
      const store = {
        name: storeData.name,
        address: storeData.address || '',
        latitude: storeData.latitude || null,
        longitude: storeData.longitude || null,
        updated_at: now,
        is_synced: 0,
      };

      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `UPDATE stores SET 
              name = ?, address = ?, latitude = ?, longitude = ?, updated_at = ?, is_synced = ? 
            WHERE id = ?`,
            [
              store.name, store.address, store.latitude, store.longitude,
              store.updated_at, store.is_synced, storeData.id
            ],
            (_, result) => {
              if (result.rowsAffected > 0) {
                // Atualizar lista de lojas
                setStores(prevStores => 
                  prevStores.map(s => 
                    s.id === storeData.id ? { ...s, ...store, id: storeData.id } : s
                  )
                );
                
                // Tentar sincronizar com o Firestore se estiver autenticado
                if (isAuthenticated) {
                  syncWithFirestore();
                }
                
                resolve({
                  success: true,
                  store: {
                    ...storeData,
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
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      return { success: false, error: error.message || 'Erro ao atualizar loja' };
    }
  };

  // Excluir loja
  const deleteStore = async (storeId) => {
    try {
      const now = Date.now();

      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'UPDATE stores SET is_deleted = 1, updated_at = ?, is_synced = 0 WHERE id = ?',
            [now, storeId],
            (_, result) => {
              if (result.rowsAffected > 0) {
                // Atualizar lista de lojas
                setStores(prevStores => 
                  prevStores.filter(store => store.id !== storeId)
                );
                
                // Tentar sincronizar com o Firestore se estiver autenticado
                if (isAuthenticated) {
                  syncWithFirestore();
                }
                
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
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      return { success: false, error: error.message || 'Erro ao excluir loja' };
    }
  };

  // Buscar lojas por texto
  const searchStores = async (query) => {
    try {
      const searchTerm = `%${query}%`;
      
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM stores 
             WHERE (name LIKE ? OR address LIKE ?) 
             AND is_deleted = 0 
             ORDER BY name ASC`,
            [searchTerm, searchTerm],
            (_, { rows }) => {
              const storesList = rows._array.map(item => ({
                ...item,
                latitude: item.latitude ? parseFloat(item.latitude) : null,
                longitude: item.longitude ? parseFloat(item.longitude) : null,
              }));
              resolve({ success: true, stores: storesList });
            },
            (_, error) => {
              console.error('Erro ao buscar lojas:', error);
              reject({ success: false, error });
              return false;
            }
          );
        });
      });
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      return { success: false, error: error.message || 'Erro ao buscar lojas' };
    }
  };

  // Sincronizar com o Firestore
  const syncWithFirestore = async () => {
    if (!isAuthenticated || !user?.uid) {
      return { success: false, error: 'Usuário não autenticado' };
    }
    
    try {
      setSyncStatus('syncing');
      
      // Obter lojas não sincronizadas
      const unsyncedStores = await new Promise((resolve, reject) => {
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

      if (unsyncedStores.length === 0) {
        setSyncStatus('synced');
        return { success: true, message: 'Nenhuma loja para sincronizar' };
      }

      // Sincronizar com o Firestore
      const db = firestore();
      const batch = db.batch();
      
      for (const store of unsyncedStores) {
        const storeRef = db.collection('stores').doc(store.id);
        
        if (store.is_deleted) {
          // Marcar como excluído no Firestore
          batch.update(storeRef, { isDeleted: true, updatedAt: firestore.FieldValue.serverTimestamp() });
        } else {
          // Adicionar ou atualizar no Firestore
          batch.set(storeRef, {
            name: store.name,
            address: store.address,
            latitude: store.latitude,
            longitude: store.longitude,
            userId: user.uid,
            createdAt: firestore.Timestamp.fromMillis(store.created_at),
            updatedAt: firestore.FieldValue.serverTimestamp(),
            isDeleted: false
          }, { merge: true });
        }
      }
      
      await batch.commit();
      
      // Atualizar status de sincronização no banco local
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          unsyncedStores.forEach(store => {
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
      
      setSyncStatus('synced');
      return { 
        success: true, 
        message: `${unsyncedStores.length} lojas sincronizadas com sucesso` 
      };
    } catch (error) {
      console.error('Erro na sincronização de lojas:', error);
      setSyncStatus('offline');
      return { 
        success: false, 
        error: error.message || 'Erro na sincronização de lojas' 
      };
    }
  };

  return (
    <StoresContext.Provider
      value={{
        stores,
        loading,
        syncStatus,
        loadStores,
        getStoreById,
        addStore,
        updateStore,
        deleteStore,
        searchStores,
        syncWithFirestore,
      }}
    >
      {children}
    </StoresContext.Provider>
  );
};

export const useStores = () => useContext(StoresContext);