import create from 'zustand';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addToCart: (product) => set((state) => {
    // Lógica para adicionar ou incrementar a quantidade do produto
    const existingItem = state.items.find(item => item.id === product.id);
    if (existingItem) {
      // ...
    }
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  clearCart: () => set({ items: [] }),
}));