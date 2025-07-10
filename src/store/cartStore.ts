import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  discount?: number; // Desconto por item (valor fixo)
  discountPercent?: number; // Desconto por item (percentual)
  notes?: string; // Observações por item
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  isActive: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'money', name: 'Dinheiro', icon: 'cash' },
  { id: 'credit', name: 'Cartão de Crédito', icon: 'credit-card' },
  { id: 'debit', name: 'Cartão de Débito', icon: 'credit-card-outline' },
  { id: 'pix', name: 'PIX', icon: 'qrcode' },
  { id: 'transfer', name: 'Transferência', icon: 'bank-transfer' },
];

// Cupons pré-definidos para teste
export const DEFAULT_COUPONS: Coupon[] = [
  { id: '1', code: 'DESCONTO10', type: 'percentage', value: 10, minPurchase: 50, isActive: true },
  { id: '2', code: 'FIXO5', type: 'fixed', value: 5, minPurchase: 20, isActive: true },
  { id: '3', code: 'MEGA20', type: 'percentage', value: 20, minPurchase: 100, maxDiscount: 50, isActive: true },
];

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  discount: number; // Desconto total (valor fixo)
  discountPercent: number; // Desconto total (percentual)
  appliedCoupon: Coupon | null;
  couponCode: string;
  paymentMethod: string;
  customerName: string;
  saleNotes: string;
  
  // Operações do carrinho
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  
  // Operações de desconto
  setDiscount: (discount: number) => void;
  setDiscountPercent: (percent: number) => void;
  setItemDiscount: (productId: number, discount: number) => void;
  setItemDiscountPercent: (productId: number, percent: number) => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  setCouponCode: (code: string) => void;
  
  // Operações de pagamento
  setPaymentMethod: (method: string) => void;
  setCustomerName: (name: string) => void;
  setSaleNotes: (notes: string) => void;
  
  // Persistência
  loadCart: () => Promise<void>;
  saveCart: () => Promise<void>;
  
  // Utilitários
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
  getItemById: (productId: number) => CartItem | undefined;
  getFinalTotal: () => number;
  getTotalDiscount: () => number;
  getItemDiscount: (item: CartItem) => number;
}

const CART_STORAGE_KEY = '@smartpdv_cart';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  discount: 0,
  discountPercent: 0,
  appliedCoupon: null,
  couponCode: '',
  paymentMethod: 'money',
  customerName: '',
  saleNotes: '',

  addToCart: (product) => {
    set((state) => {
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Se o produto já existe, incrementa a quantidade
        const newQuantity = existingItem.quantity + 1;
        
        // Verifica se não excede o estoque
        if (newQuantity > existingItem.stock) {
          alert(`Estoque insuficiente! Máximo disponível: ${existingItem.stock}`);
          return state;
        }
        
        return {
          items: state.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        };
      } else {
        // Adiciona novo produto ao carrinho
        return {
          items: [...state.items, { ...product, quantity: 1 }]
        };
      }
    });
    
    // Salva automaticamente após adicionar
    get().saveCart();
  },

  removeFromCart: (productId) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== productId)
    }));
    get().saveCart();
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      const item = state.items.find(item => item.id === productId);
      
      if (!item) return state;
      
      // Validações
      if (quantity <= 0) {
        // Remove o item se quantidade for 0 ou negativa
        return {
          items: state.items.filter(item => item.id !== productId)
        };
      }
      
      if (quantity > item.stock) {
        alert(`Estoque insuficiente! Máximo disponível: ${item.stock}`);
        return state;
      }
      
      return {
        items: state.items.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        )
      };
    });
    get().saveCart();
  },

  clearCart: () => {
    set({ 
      items: [], 
      discount: 0, 
      discountPercent: 0,
      appliedCoupon: null,
      couponCode: '',
      paymentMethod: 'money', 
      customerName: '', 
      saleNotes: '' 
    });
    get().saveCart();
  },

  setDiscount: (discount) => {
    set({ discount: Math.max(0, discount) });
    get().saveCart();
  },

  setDiscountPercent: (percent) => {
    set({ discountPercent: Math.max(0, Math.min(100, percent)) });
    get().saveCart();
  },

  setItemDiscount: (productId, discount) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === productId
          ? { ...item, discount: Math.max(0, discount) }
          : item
      )
    }));
    get().saveCart();
  },

  setItemDiscountPercent: (productId, percent) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === productId
          ? { ...item, discountPercent: Math.max(0, Math.min(100, percent)) }
          : item
      )
    }));
    get().saveCart();
  },

  applyCoupon: (code) => {
    const coupon = DEFAULT_COUPONS.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    
    if (!coupon) {
      alert('Cupom inválido ou inativo!');
      return false;
    }

    const subtotal = get().getSubtotal();
    
    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      alert(`Valor mínimo para este cupom: R$ ${coupon.minPurchase.toFixed(2)}`);
      return false;
    }

    set({ 
      appliedCoupon: coupon,
      couponCode: code.toUpperCase()
    });
    get().saveCart();
    
    alert(`Cupom aplicado: ${coupon.code}`);
    return true;
  },

  removeCoupon: () => {
    set({ 
      appliedCoupon: null,
      couponCode: ''
    });
    get().saveCart();
  },

  setCouponCode: (code) => {
    set({ couponCode: code });
    get().saveCart();
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
    get().saveCart();
  },

  setCustomerName: (name) => {
    set({ customerName: name });
    get().saveCart();
  },

  setSaleNotes: (notes) => {
    set({ saleNotes: notes });
    get().saveCart();
  },

  loadCart: async () => {
    set({ isLoading: true });
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        set({
          items: cartData.items || [],
          discount: cartData.discount || 0,
          discountPercent: cartData.discountPercent || 0,
          appliedCoupon: cartData.appliedCoupon || null,
          couponCode: cartData.couponCode || '',
          paymentMethod: cartData.paymentMethod || 'money',
          customerName: cartData.customerName || '',
          saleNotes: cartData.saleNotes || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveCart: async () => {
    try {
      const { 
        items, 
        discount, 
        discountPercent,
        appliedCoupon,
        couponCode,
        paymentMethod, 
        customerName, 
        saleNotes 
      } = get();
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        items,
        discount,
        discountPercent,
        appliedCoupon,
        couponCode,
        paymentMethod,
        customerName,
        saleNotes,
      }));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  },

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = get().getItemDiscount(item);
      return total + (itemTotal - itemDiscount);
    }, 0);
  },

  getTotal: () => {
    const { discount, discountPercent, appliedCoupon } = get();
    const subtotal = get().getSubtotal();
    
    // Aplica desconto percentual total
    const percentDiscount = (subtotal * discountPercent) / 100;
    
    // Aplica cupom se existir
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        couponDiscount = (subtotal * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscount);
        }
      } else {
        couponDiscount = appliedCoupon.value;
      }
    }
    
    return subtotal - discount - percentDiscount - couponDiscount;
  },

  getFinalTotal: () => {
    return get().getTotal();
  },

  getTotalDiscount: () => {
    const { discount, discountPercent, appliedCoupon } = get();
    const subtotal = get().getSubtotal();
    
    // Desconto por item
    const itemDiscounts = get().items.reduce((total, item) => {
      return total + get().getItemDiscount(item);
    }, 0);
    
    // Desconto percentual total
    const percentDiscount = (subtotal * discountPercent) / 100;
    
    // Desconto do cupom
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        couponDiscount = (subtotal * appliedCoupon.value) / 100;
        if (appliedCoupon.maxDiscount) {
          couponDiscount = Math.min(couponDiscount, appliedCoupon.maxDiscount);
        }
      } else {
        couponDiscount = appliedCoupon.value;
      }
    }
    
    return itemDiscounts + discount + percentDiscount + couponDiscount;
  },

  getItemDiscount: (item) => {
    const itemTotal = item.price * item.quantity;
    const fixedDiscount = item.discount || 0;
    const percentDiscount = item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0;
    return fixedDiscount + percentDiscount;
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },

  getItemById: (productId) => {
    const { items } = get();
    return items.find(item => item.id === productId);
  },
}));