import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Customer } from '../database/customerService';

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
  { id: 'dinheiro', name: 'Dinheiro', icon: 'cash' },
  { id: 'pix', name: 'PIX', icon: 'qrcode-scan' },
  { id: 'cartao_credito', name: 'Cartão de Crédito', icon: 'credit-card' },
  { id: 'cartao_debito', name: 'Cartão de Débito', icon: 'credit-card-outline' },
  { id: 'vale', name: 'Vale', icon: 'ticket' },
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
  customerId?: string; // ID do cliente selecionado
  selectedCustomer?: Customer; // Cliente selecionado
  saleNotes: string;
  loyaltyPointsUsed: number; // Pontos de fidelidade usados
  
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
  
  // Operações de cliente
  setCustomer: (customer: Customer | null) => void;
  setCustomerName: (name: string) => void;
  useLoyaltyPoints: (points: number) => boolean;
  
  // Operações de pagamento
  setPaymentMethod: (method: string) => void;
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
  getLoyaltyPointsEarned: () => number;
}

const CART_STORAGE_KEY = '@smartpdv_cart';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  discount: 0,
  discountPercent: 0,
  appliedCoupon: null,
  couponCode: '',
  paymentMethod: 'dinheiro',
  customerName: '',
  customerId: undefined,
  selectedCustomer: undefined,
  saleNotes: '',
  loyaltyPointsUsed: 0,

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
      paymentMethod: 'dinheiro', 
      customerName: '', 
      customerId: undefined,
      selectedCustomer: undefined,
      saleNotes: '',
      loyaltyPointsUsed: 0
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
    const coupon = DEFAULT_COUPONS.find(c => c.code === code && c.isActive);
    
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
      couponCode: code
    });
    get().saveCart();
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

  setCustomer: (customer) => {
    set({ 
      selectedCustomer: customer || undefined,
      customerId: customer?.id,
      customerName: customer?.name || ''
    });
    get().saveCart();
  },

  setCustomerName: (name) => {
    set({ customerName: name });
    get().saveCart();
  },

  useLoyaltyPoints: (points) => {
    const state = get();
    const customer = state.selectedCustomer;
    
    if (!customer) {
      alert('Selecione um cliente para usar pontos de fidelidade!');
      return false;
    }
    
    if (points > customer.loyaltyPoints) {
      alert(`Cliente possui apenas ${customer.loyaltyPoints} pontos!`);
      return false;
    }
    
    if (points > state.getFinalTotal()) {
      alert('Pontos não podem exceder o valor total da compra!');
      return false;
    }
    
    set({ loyaltyPointsUsed: points });
    get().saveCart();
    return true;
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
    get().saveCart();
  },

  setSaleNotes: (notes) => {
    set({ saleNotes: notes });
    get().saveCart();
  },

  loadCart: async () => {
    try {
      set({ isLoading: true });
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        set({
          items: cartData.items || [],
          discount: cartData.discount || 0,
          discountPercent: cartData.discountPercent || 0,
          appliedCoupon: cartData.appliedCoupon || null,
          couponCode: cartData.couponCode || '',
          paymentMethod: cartData.paymentMethod || 'dinheiro',
          customerName: cartData.customerName || '',
          customerId: cartData.customerId,
          saleNotes: cartData.saleNotes || '',
          loyaltyPointsUsed: cartData.loyaltyPointsUsed || 0,
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
      const state = get();
      const cartData = {
        items: state.items,
        discount: state.discount,
        discountPercent: state.discountPercent,
        appliedCoupon: state.appliedCoupon,
        couponCode: state.couponCode,
        paymentMethod: state.paymentMethod,
        customerName: state.customerName,
        customerId: state.customerId,
        saleNotes: state.saleNotes,
        loyaltyPointsUsed: state.loyaltyPointsUsed,
      };
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  },

  getTotal: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const itemDiscount = state.getItemDiscount(item);
      return total + (itemTotal - itemDiscount);
    }, 0);
  },

  getSubtotal: () => {
    const state = get();
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getItemCount: () => {
    const state = get();
    return state.items.reduce((count, item) => count + item.quantity, 0);
  },

  getItemById: (productId) => {
    const state = get();
    return state.items.find(item => item.id === productId);
  },

  getFinalTotal: () => {
    const state = get();
    const subtotal = state.getTotal();
    const couponDiscount = state.appliedCoupon 
      ? state.appliedCoupon.type === 'percentage'
        ? (subtotal * state.appliedCoupon.value / 100)
        : state.appliedCoupon.value
      : 0;
    
    const totalDiscount = state.discount + (subtotal * state.discountPercent / 100) + couponDiscount;
    const totalAfterDiscount = Math.max(0, subtotal - totalDiscount);
    const finalTotal = Math.max(0, totalAfterDiscount - state.loyaltyPointsUsed);
    
    return finalTotal;
  },

  getTotalDiscount: () => {
    const state = get();
    const subtotal = state.getTotal();
    const itemDiscounts = state.items.reduce((total, item) => total + state.getItemDiscount(item), 0);
    const couponDiscount = state.appliedCoupon 
      ? state.appliedCoupon.type === 'percentage'
        ? (subtotal * state.appliedCoupon.value / 100)
        : state.appliedCoupon.value
      : 0;
    
    return state.discount + (subtotal * state.discountPercent / 100) + itemDiscounts + couponDiscount + state.loyaltyPointsUsed;
  },

  getItemDiscount: (item) => {
    const itemDiscount = item.discount || 0;
    const itemPercentDiscount = item.discountPercent 
      ? (item.price * item.quantity * item.discountPercent / 100)
      : 0;
    return itemDiscount + itemPercentDiscount;
  },

  getLoyaltyPointsEarned: () => {
    const state = get();
    const finalTotal = state.getFinalTotal();
    return Math.floor(finalTotal / 10); // 1 ponto a cada R$ 10
  },
}));