import AsyncStorage from '@react-native-async-storage/async-storage';
import { salesDb } from '../../src/database/salesService';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('SalesService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await salesDb.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveSale', () => {
    it('deve adicionar uma venda com sucesso', async () => {
      const sale = {
        items: [
          { id: 1, name: 'Produto 1', price: 10, quantity: 2 }
        ],
        subtotal: 20,
        discount: 0,
        finalTotal: 20,
        paymentMethod: 'dinheiro',
        customerName: 'Cliente Teste'
      };

      const savedSale = await salesDb.saveSale(sale);

      const sales = await salesDb.getAllSales();
      expect(sales).toHaveLength(1);
      expect(savedSale.finalTotal).toBe(20);
      expect(savedSale.paymentMethod).toBe('dinheiro');
    });

    it('deve gerar ID automático para a venda', async () => {
      const sale = {
        items: [{ id: 1, name: 'Produto 1', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        finalTotal: 10,
        paymentMethod: 'DINHEIRO'
      };

      const savedSale = await salesDb.saveSale(sale);

      expect(savedSale.id).toBeDefined();
      expect(typeof savedSale.id).toBe('string');
    });
  });

  describe('getAllSales', () => {
    it('deve retornar lista vazia quando não há vendas', async () => {
      const sales = await salesDb.getAllSales();
      expect(sales).toEqual([]);
    });

    it('deve retornar todas as vendas', async () => {
      const sale1 = {
        items: [{ id: 1, name: 'Produto 1', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        finalTotal: 10,
        paymentMethod: 'dinheiro'
      };
      const sale2 = {
        items: [{ id: 2, name: 'Produto 2', price: 20, quantity: 1 }],
        subtotal: 20,
        discount: 0,
        finalTotal: 20,
        paymentMethod: 'CARTÃO'
      };

      await salesDb.saveSale(sale1);
      await salesDb.saveSale(sale2);

      const sales = await salesDb.getAllSales();
      expect(sales).toHaveLength(2);
      expect(sales[0].finalTotal).toBe(10);
      expect(sales[1].finalTotal).toBe(20);
    });
  });

  describe('getSalesByDateRange', () => {
    it('deve retornar vendas em um período específico', async () => {
      const sale1 = {
        items: [{ id: 1, name: 'Produto 1', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        finalTotal: 10,
        paymentMethod: 'dinheiro'
      };
      const sale2 = {
        items: [{ id: 2, name: 'Produto 2', price: 20, quantity: 1 }],
        subtotal: 20,
        discount: 0,
        finalTotal: 20,
        paymentMethod: 'CARTÃO'
      };

      await salesDb.saveSale(sale1);
      await salesDb.saveSale(sale2);

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const sales = await salesDb.getSalesByDateRange(today, tomorrow);
      expect(sales).toHaveLength(2);
    });
  });

  describe('getSalesByPaymentMethod', () => {
    it('deve retornar vendas por método de pagamento', async () => {
      const sale1 = {
        items: [{ id: 1, name: 'Produto 1', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        finalTotal: 10,
        paymentMethod: 'dinheiro'
      };
      const sale2 = {
        items: [{ id: 2, name: 'Produto 2', price: 20, quantity: 1 }],
        subtotal: 20,
        discount: 0,
        finalTotal: 20,
        paymentMethod: 'CARTÃO'
      };

      await salesDb.saveSale(sale1);
      await salesDb.saveSale(sale2);

      const dinheiroSales = await salesDb.getSalesByPaymentMethod('dinheiro');
      expect(dinheiroSales).toHaveLength(1);
      expect(dinheiroSales[0].paymentMethod).toBe('dinheiro');
    });
  });

  describe('getSalesStats', () => {
    it('deve calcular estatísticas de vendas', async () => {
      const sale1 = {
        items: [{ id: 1, name: 'Produto 1', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        finalTotal: 10,
        paymentMethod: 'dinheiro'
      };
      const sale2 = {
        items: [{ id: 2, name: 'Produto 2', price: 20, quantity: 1 }],
        subtotal: 20,
        discount: 0,
        finalTotal: 20,
        paymentMethod: 'CARTÃO'
      };

      await salesDb.saveSale(sale1);
      await salesDb.saveSale(sale2);

      const stats = await salesDb.getSalesStats();
      expect(stats.totalSales).toBe(2);
      expect(stats.totalRevenue).toBe(30);
    });
  });

  describe('deleteSale', () => {
    it('deve deletar uma venda', async () => {
      const sale = {
        items: [{ id: 1, name: 'Produto 1', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        finalTotal: 10,
        paymentMethod: 'dinheiro'
      };

      const savedSale = await salesDb.saveSale(sale);
      const result = await salesDb.deleteSale(savedSale.id);

      expect(result).toBe(true);
      
      const sales = await salesDb.getAllSales();
      expect(sales).toHaveLength(0);
    });
  });
}); 