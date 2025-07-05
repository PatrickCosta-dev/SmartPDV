import * as SQLite from 'expo-sqlite';

export function getDbConnection() {
  const db = SQLite.openDatabase('pdv-app.db');
  return db;
}

export function createTables(db: SQLite.SQLiteDatabase) {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL
      );`
    );
    // Crie as outras tabelas aqui (customers, sales, etc.)
    console.log("Tabelas criadas com sucesso!");
  });
};