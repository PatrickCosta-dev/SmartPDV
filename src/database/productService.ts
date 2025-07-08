import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Versão "falsa" para a Web, para evitar erros.
const createWebDb = () => ({
  initDatabase: async (): Promise<void> => { console.log("DB na Web: pulando inicialização."); },
  getAllProducts: async (): Promise<Product[]> => { console.log("DB na Web: retornando lista vazia."); return []; },
  addProduct: async (product: Omit<Product, 'id'>): Promise<void> => { console.log("DB na Web: pulando adição de produto.", product); },
});

// Versão real e estável para Nativo (Android/iOS)
const createNativeDb = () => {
  function getDbConnection() {
    return SQLite.openDatabase('pdv_app.db');
  }

  const db = getDbConnection();

  async function initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, stock INTEGER NOT NULL
          );`,
          [],
          () => {
            console.log("Tabela de produtos verificada/criada com sucesso!");
            resolve();
          },
          (_, error) => { 
            console.error("Erro ao criar tabela: ", error);
            reject(error); 
            return false; 
          }
        );
      });
    });
  }

  async function getAllProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM products;',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => { 
            console.error("Erro ao buscar produtos: ", error);
            reject(error); 
            return false; 
          }
        );
      });
    });
  }

  async function addProduct(product: Omit<Product, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO products (name, price, stock) VALUES (?, ?, ?);',
          [product.name, product.price, product.stock],
          () => resolve(),
          (_, error) => { 
            console.error("Erro ao adicionar produto: ", error);
            reject(error); 
            return false; 
          }
        );
      });
    });
  }
  
  return { initDatabase, getAllProducts, addProduct };
};

// Exporta a versão correta baseada na plataforma
export const db = Platform.OS === 'web' ? createWebDb() : createNativeDb();