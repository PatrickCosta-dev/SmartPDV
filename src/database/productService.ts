import * as SQLite from 'expo-sqlite';

// --- Tipo de Dado ---
// Define como um objeto "Produto" deve se parecer no nosso código.
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// --- Conexão com o Banco ---
// Abre ou cria o arquivo do banco de dados.
function getDbConnection() {
  const db = SQLite.openDatabase('pdv_app.db');
  return db;
}

// --- Funções do Banco de Dados ---

// 1. Inicializa o banco de dados e cria a tabela se ela não existir.
export async function initDatabase() {
  const db = getDbConnection();
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          stock INTEGER NOT NULL
        );`,
        [],
        () => resolve(), // Sucesso
        (_, error) => { // Erro
          reject(error);
          return false; // Retornar false para reverter a transação
        }
      );
    });
  });
}

// 2. Busca todos os produtos da tabela.
export async function getAllProducts(): Promise<Product[]> {
  const db = getDbConnection();
  return new Promise<Product[]>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM products;',
        [],
        (_, { rows }) => {
          resolve(rows._array);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

// 3. Adiciona um novo produto na tabela.
export async function addProduct(product: Omit<Product, 'id'>): Promise<SQLite.SQLResultSet> {
  const db = getDbConnection();
  return new Promise<SQLite.SQLResultSet>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO products (name, price, stock) VALUES (?, ?, ?);',
        [product.name, product.price, product.stock],
        (_, result) => {
          resolve(result);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}