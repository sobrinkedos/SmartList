import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, syncDataWithFirestore } from './firebase';
import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

// Abrir conexão com o banco de dados
const db = SQLite.openDatabase('smartlist.db');

/**
 * Serviço para gerenciar produtos
 */
export const ProductService = {
  /**
   * Obter todos os produtos
   */
  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products WHERE is_deleted = 0 ORDER BY name ASC',
          [],
          (_, { rows }) => {
            const products = rows._array.map(item => ({
              ...item,
              price: parseFloat(item.price),
              quantity: parseFloat(item.quantity),
              lastPurchase: item.last_purchase ? new Date(item.last_purchase) : null,
            }));
            resolve(products);
          },
          (_, error) => {
            console.error('Erro ao obter produtos:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Obter produto por ID
   * @param {string} id - ID do produto
   */
  getProductById: (id) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products WHERE id = ? AND is_deleted = 0',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const product = rows.item(0);
              resolve({
                ...product,
                price: parseFloat(product.price),
                quantity: parseFloat(product.quantity),
                lastPurchase: product.last_purchase ? new Date(product.last_purchase) : null,
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Erro ao obter produto:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Adicionar novo produto
   * @param {Object} product - Dados do produto
   */
  addProduct: (product) => {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const productId = product.id || uuidv4();
      
      const productData = {
        id: productId,
        name: product.name,
        brand: product.brand || '',
        category: product.category || 'outros',
        barcode: product.barcode || '',
        price: product.price || 0,
        unit: product.unit || 'un',
        quantity: product.quantity || 1,
        image_url: product.imageUrl || null,
        last_purchase: product.lastPurchase ? product.lastPurchase.getTime() : null,
        created_at: now,
        updated_at: now,
        is_synced: 0,
        is_deleted: 0,
        user_id: product.userId || null,
      };

      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO products (
            id, name, brand, category, barcode, price, unit, quantity, 
            image_url, last_purchase, created_at, updated_at, is_synced, is_deleted, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productData.id, productData.name, productData.brand, productData.category,
            productData.barcode, productData.price, productData.unit, productData.quantity,
            productData.image_url, productData.last_purchase, productData.created_at,
            productData.updated_at, productData.is_synced, productData.is_deleted, productData.user_id
          ],
          (_, result) => {
            resolve({
              success: true,
              product: {
                ...product,
                id: productId,
                created_at: now,
                updated_at: now,
              }
            });
          },
          (_, error) => {
            console.error('Erro ao adicionar produto:', error);
            reject({
              success: false,
              error: error.message || 'Erro ao adicionar produto'
            });
            return false;
          }
        );
      });
    });
  },

  /**
   * Atualizar produto existente
   * @param {Object} product - Dados do produto
   */
  updateProduct: (product) => {
    return new Promise((resolve, reject) => {
      if (!product.id) {
        reject({
          success: false,
          error: 'ID do produto não fornecido'
        });
        return;
      }

      const now = Date.now();
      
      const productData = {
        name: product.name,
        brand: product.brand || '',
        category: product.category || 'outros',
        barcode: product.barcode || '',
        price: product.price || 0,
        unit: product.unit || 'un',
        quantity: product.quantity || 1,
        image_url: product.imageUrl || null,
        last_purchase: product.lastPurchase ? product.lastPurchase.getTime() : null,
        updated_at: now,
        is_synced: 0,
      };

      db.transaction(tx => {
        tx.executeSql(
          `UPDATE products SET 
            name = ?, brand = ?, category = ?, barcode = ?, price = ?, 
            unit = ?, quantity = ?, image_url = ?, last_purchase = ?, 
            updated_at = ?, is_synced = ? 
          WHERE id = ?`,
          [
            productData.name, productData.brand, productData.category,
            productData.barcode, productData.price, productData.unit,
            productData.quantity, productData.image_url, productData.last_purchase,
            productData.updated_at, productData.is_synced, product.id
          ],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve({
                success: true,
                product: {
                  ...product,
                  updated_at: now,
                }
              });
            } else {
              reject({
                success: false,
                error: 'Produto não encontrado'
              });
            }
          },
          (_, error) => {
            console.error('Erro ao atualizar produto:', error);
            reject({
              success: false,
              error: error.message || 'Erro ao atualizar produto'
            });
            return false;
          }
        );
      });
    });
  },

  /**
   * Excluir produto
   * @param {string} id - ID do produto
   */
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      const now = Date.now();

      db.transaction(tx => {
        tx.executeSql(
          'UPDATE products SET is_deleted = 1, updated_at = ?, is_synced = 0 WHERE id = ?',
          [now, id],
          (_, result) => {
            if (result.rowsAffected > 0) {
              resolve({ success: true });
            } else {
              reject({
                success: false,
                error: 'Produto não encontrado'
              });
            }
          },
          (_, error) => {
            console.error('Erro ao excluir produto:', error);
            reject({
              success: false,
              error: error.message || 'Erro ao excluir produto'
            });
            return false;
          }
        );
      });
    });
  },

  /**
   * Buscar produtos por texto
   * @param {string} query - Texto para busca
   */
  searchProducts: (query) => {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`;
      
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM products 
           WHERE (name LIKE ? OR brand LIKE ? OR barcode LIKE ?) 
           AND is_deleted = 0 
           ORDER BY name ASC`,
          [searchTerm, searchTerm, searchTerm],
          (_, { rows }) => {
            const products = rows._array.map(item => ({
              ...item,
              price: parseFloat(item.price),
              quantity: parseFloat(item.quantity),
              lastPurchase: item.last_purchase ? new Date(item.last_purchase) : null,
            }));
            resolve(products);
          },
          (_, error) => {
            console.error('Erro ao buscar produtos:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Filtrar produtos por categoria
   * @param {string} category - Categoria para filtro
   */
  filterByCategory: (category) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products WHERE category = ? AND is_deleted = 0 ORDER BY name ASC',
          [category],
          (_, { rows }) => {
            const products = rows._array.map(item => ({
              ...item,
              price: parseFloat(item.price),
              quantity: parseFloat(item.quantity),
              lastPurchase: item.last_purchase ? new Date(item.last_purchase) : null,
            }));
            resolve(products);
          },
          (_, error) => {
            console.error('Erro ao filtrar produtos por categoria:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Sincronizar produtos com o Firestore
   */
  syncWithFirestore: async () => {
    try {
      // Obter produtos não sincronizados
      const products = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM products WHERE is_synced = 0',
            [],
            (_, { rows }) => resolve(rows._array),
            (_, error) => {
              console.error('Erro ao obter produtos para sincronização:', error);
              reject(error);
              return false;
            }
          );
        });
      });

      if (products.length === 0) {
        return { success: true, message: 'Nenhum produto para sincronizar' };
      }

      // Sincronizar com o Firestore
      const result = await syncDataWithFirestore('products', products);

      if (result.success) {
        // Atualizar status de sincronização no banco local
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            products.forEach(product => {
              tx.executeSql(
                'UPDATE products SET is_synced = 1 WHERE id = ?',
                [product.id],
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
          message: `${products.length} produtos sincronizados com sucesso` 
        };
      } else {
        throw new Error(result.error || 'Erro ao sincronizar com Firestore');
      }
    } catch (error) {
      console.error('Erro na sincronização de produtos:', error);
      return { 
        success: false, 
        error: error.message || 'Erro na sincronização de produtos' 
      };
    }
  },

  /**
   * Obter histórico de preços de um produto
   * @param {string} productId - ID do produto
   */
  getPriceHistory: (productId) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM prices WHERE product_id = ? ORDER BY date ASC`,
          [productId],
          (_, { rows }) => {
            const priceHistory = rows._array.map(item => ({
              ...item,
              price: parseFloat(item.price),
              date: new Date(item.date),
            }));
            resolve(priceHistory);
          },
          (_, error) => {
            console.error('Erro ao obter histórico de preços:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  },

  /**
   * Adicionar registro de preço ao histórico
   * @param {string} productId - ID do produto
   * @param {number} price - Preço
   * @param {string} storeId - ID da loja (opcional)
   */
  addPriceRecord: (productId, price, storeId = null) => {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const recordId = uuidv4();
      
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO prices (
            id, product_id, price, date, store_id, created_at, is_synced
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [recordId, productId, price, now, storeId, now, 0],
          (_, result) => {
            resolve({
              success: true,
              priceRecord: {
                id: recordId,
                product_id: productId,
                price,
                date: new Date(now),
                store_id: storeId,
                created_at: now,
              }
            });
          },
          (_, error) => {
            console.error('