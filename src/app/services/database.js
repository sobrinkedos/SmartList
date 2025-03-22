import * as SQLite from 'expo-sqlite';

// Abrir conexão com o banco de dados
const db = SQLite.openDatabase('smartlist.db');

/**
 * Inicializa o banco de dados local criando as tabelas necessárias
 */
export const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        // Tabela de usuários
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            display_name TEXT,
            photo_url TEXT,
            last_login INTEGER,
            preferences TEXT
          )`,
          [],
          () => console.log('Tabela de usuários criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de usuários:', error)
        );

        // Tabela de produtos
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            barcode TEXT,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            image_url TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            is_synced INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            user_id TEXT
          )`,
          [],
          () => console.log('Tabela de produtos criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de produtos:', error)
        );

        // Tabela de preços
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS prices (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            store_id TEXT,
            price REAL NOT NULL,
            date INTEGER,
            is_synced INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
          )`,
          [],
          () => console.log('Tabela de preços criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de preços:', error)
        );

        // Tabela de lojas/mercados
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS stores (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            latitude REAL,
            longitude REAL,
            created_at INTEGER,
            updated_at INTEGER,
            is_synced INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0
          )`,
          [],
          () => console.log('Tabela de lojas criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de lojas:', error)
        );

        // Tabela de orçamentos
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            start_date INTEGER,
            end_date INTEGER,
            category TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            is_synced INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            user_id TEXT
          )`,
          [],
          () => console.log('Tabela de orçamentos criada com sucesso'),
          (_, error) => console.error('Erro ao criar tabela de orçamentos:', error)
        );

        // Tabela de configurações
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            key TEXT NOT NULL,
            value TEXT,
            user_id TEXT
          )`,
          [],
          () => {
            console.log('Tabela de configurações criada com sucesso');
            resolve({ success: true });
          },
          (_, error) => {
            console.error('Erro ao criar tabela de configurações:', error);
            reject({ success: false, error });
          }
        );
      });
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      reject({ success: false, error });
    }
  });
};

/**
 * Executa uma consulta SQL no banco de dados local
 * @param {string} query - Consulta SQL a ser executada
 * @param {Array} params - Parâmetros para a consulta
 */
export const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

/**
 * Limpa o banco de dados local (útil para logout ou reset)
 */
export const clearDatabase = async () => {
  const tables = [
    'users',
    'products',
    'prices',
    'lists',
    'list_items',
    'stores',
    'budgets',
    'settings'
  ];

  try {
    for (const table of tables) {
      await executeQuery(`DELETE FROM ${table}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
    return { success: false, error };
  }
};

export default db;