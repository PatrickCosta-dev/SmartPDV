import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Versão para Web - usando localStorage como fallback
const createWebDb = () => {
  const STORAGE_KEY = '@smartpdv_products';
  
  // Carrega produtos do localStorage
  const loadProducts = (): Product[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos da web:', error);
      return [];
    }
  };

  // Salva produtos no localStorage
  const saveProducts = (products: Product[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erro ao salvar produtos na web:', error);
    }
  };

  async function initDatabase(): Promise<void> {
    console.log("DB na Web: Inicializando com localStorage.");
    // Garante que existe pelo menos um array vazio
    if (!localStorage.getItem(STORAGE_KEY)) {
      saveProducts([]);
    }
  }

  async function getAllProducts(): Promise<Product[]> {
    console.log("DB na Web: Carregando produtos do localStorage.");
    return loadProducts();
  }

  async function addProduct(product: Omit<Product, 'id'>): Promise<void> {
    console.log("DB na Web: Adicionando produto via localStorage.", product);
    const products = loadProducts();
    const newProduct: Product = {
      id: Date.now(), // Usa timestamp como ID único
      ...product
    };
    products.push(newProduct);
    saveProducts(products);
  }

  return { initDatabase, getAllProducts, addProduct };
};

// Versão para Nativo (Android/iOS) - usando AsyncStorage
const createNativeDb = () => {
  const STORAGE_KEY = '@smartpdv_products_native';
  
  const loadProducts = async (): Promise<Product[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }
  };

  const saveProducts = async (products: Product[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
    }
  };

  async function initDatabase(): Promise<void> {
    console.log("DB Nativo: Inicializando com AsyncStorage.");
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      if (!existing) {
        await saveProducts([]);
      }
    } catch (error) {
      console.error('Erro ao inicializar banco nativo:', error);
    }
  }

  async function getAllProducts(): Promise<Product[]> {
    console.log("DB Nativo: Carregando produtos do AsyncStorage.");
    return await loadProducts();
  }

  async function addProduct(product: Omit<Product, 'id'>): Promise<void> {
    console.log("DB Nativo: Adicionando produto via AsyncStorage.", product);
    const products = await loadProducts();
    const newProduct: Product = {
      id: Date.now(),
      ...product
    };
    products.push(newProduct);
    await saveProducts(products);
  }
  
  return { initDatabase, getAllProducts, addProduct };
};

// Exporta a versão correta baseada na plataforma
export const db = Platform.OS === 'web' ? createWebDb() : createNativeDb();