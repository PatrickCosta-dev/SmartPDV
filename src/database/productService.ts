import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  barcode?: string;
  cost?: number;
  minStock?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Versão para Web - usando localStorage
const createWebDb = () => {
  const STORAGE_KEY = '@smartpdv_products';
  
  const loadProducts = (): Product[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar produtos da web:', error);
      return [];
    }
  };

  const saveProducts = (products: Product[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erro ao salvar produtos na web:', error);
    }
  };

  async function initDatabase(): Promise<void> {
    console.log("DB na Web: Inicializando com localStorage.");
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
      id: Date.now(),
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    products.push(newProduct);
    saveProducts(products);
  }

  async function updateProduct(id: number, product: Partial<Product>): Promise<void> {
    const products = loadProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...product, updatedAt: new Date() };
      saveProducts(products);
    }
  }

  async function deleteProduct(id: number): Promise<void> {
    const products = loadProducts();
    const filtered = products.filter(p => p.id !== id);
    saveProducts(filtered);
  }

  async function getProductById(id: number): Promise<Product | null> {
    const products = loadProducts();
    return products.find(p => p.id === id) || null;
  }

  async function searchProducts(query: string): Promise<Product[]> {
    const products = loadProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.barcode && p.barcode.includes(query))
    );
  }

  return { 
    initDatabase, 
    getAllProducts, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    getProductById,
    searchProducts
  };
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
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    products.push(newProduct);
    await saveProducts(products);
  }

  async function updateProduct(id: number, product: Partial<Product>): Promise<void> {
    const products = await loadProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...product, updatedAt: new Date() };
      await saveProducts(products);
    }
  }

  async function deleteProduct(id: number): Promise<void> {
    const products = await loadProducts();
    const filtered = products.filter(p => p.id !== id);
    await saveProducts(filtered);
  }

  async function getProductById(id: number): Promise<Product | null> {
    const products = await loadProducts();
    return products.find(p => p.id === id) || null;
  }

  async function searchProducts(query: string): Promise<Product[]> {
    const products = await loadProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.barcode && p.barcode.includes(query))
    );
  }

  return { 
    initDatabase, 
    getAllProducts, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    getProductById,
    searchProducts
  };
};

// Exporta a versão correta baseada na plataforma
export const db = Platform.OS === 'web' ? createWebDb() : createNativeDb();