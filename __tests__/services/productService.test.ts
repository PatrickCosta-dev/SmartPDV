import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../src/database/productService';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('ProductService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await db.initDatabase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addProduct', () => {
    it('deve adicionar um produto com sucesso', async () => {
      const product = {
        name: 'Produto Teste',
        price: 10.50,
        stock: 100,
        category: 'Teste',
        barcode: '123456789'
      };

      await db.addProduct(product);

      const products = await db.getAllProducts();
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Produto Teste');
      expect(products[0].price).toBe(10.50);
    });

    it('deve gerar ID automático', async () => {
      const product = {
        name: 'Produto Teste',
        price: 10.50,
        stock: 100,
        category: 'Teste'
      };

      await db.addProduct(product);

      const products = await db.getAllProducts();
      expect(products[0].id).toBeDefined();
      expect(typeof products[0].id).toBe('number');
    });
  });

  describe('getAllProducts', () => {
    it('deve retornar lista vazia quando não há produtos', async () => {
      const products = await db.getAllProducts();
      expect(products).toEqual([]);
    });

    it('deve retornar todos os produtos', async () => {
      const product1 = { name: 'Produto 1', price: 10, stock: 100, category: 'Teste' };
      const product2 = { name: 'Produto 2', price: 20, stock: 50, category: 'Teste' };

      await db.addProduct(product1);
      await db.addProduct(product2);

      const products = await db.getAllProducts();
      expect(products).toHaveLength(2);
      expect(products[0].name).toBe('Produto 1');
      expect(products[1].name).toBe('Produto 2');
    });
  });

  describe('getProductById', () => {
    it('deve retornar produto específico', async () => {
      const product = { name: 'Produto 1', price: 10, stock: 100, category: 'Teste' };
      await db.addProduct(product);

      const products = await db.getAllProducts();
      const foundProduct = await db.getProductById(products[0].id);
      
      expect(foundProduct).toBeDefined();
      expect(foundProduct?.name).toBe('Produto 1');
    });

    it('deve retornar null para produto inexistente', async () => {
      const product = await db.getProductById(999);
      expect(product).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('deve atualizar produto existente', async () => {
      const product = { name: 'Produto 1', price: 10, stock: 100, category: 'Teste' };
      await db.addProduct(product);

      const products = await db.getAllProducts();
      const productId = products[0].id;

      await db.updateProduct(productId, { name: 'Produto Atualizado', price: 15 });

      const updatedProduct = await db.getProductById(productId);
      expect(updatedProduct?.name).toBe('Produto Atualizado');
      expect(updatedProduct?.price).toBe(15);
    });
  });

  describe('deleteProduct', () => {
    it('deve deletar produto existente', async () => {
      const product = { name: 'Produto 1', price: 10, stock: 100, category: 'Teste' };
      await db.addProduct(product);

      const products = await db.getAllProducts();
      const productId = products[0].id;

      await db.deleteProduct(productId);

      const remainingProducts = await db.getAllProducts();
      expect(remainingProducts).toHaveLength(0);
    });
  });

  describe('searchProducts', () => {
    it('deve buscar produtos por nome', async () => {
      const product1 = { name: 'Produto Teste', price: 10, stock: 100, category: 'Teste' };
      const product2 = { name: 'Outro Produto', price: 20, stock: 50, category: 'Teste' };

      await db.addProduct(product1);
      await db.addProduct(product2);

      const results = await db.searchProducts('Teste');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Produto Teste');
    });

    it('deve buscar produtos por código de barras', async () => {
      const product1 = { name: 'Produto 1', price: 10, stock: 100, category: 'Teste', barcode: '123456' };
      const product2 = { name: 'Produto 2', price: 20, stock: 50, category: 'Teste', barcode: '789012' };

      await db.addProduct(product1);
      await db.addProduct(product2);

      const results = await db.searchProducts('123456');
      expect(results).toHaveLength(1);
      expect(results[0].barcode).toBe('123456');
    });
  });
}); 