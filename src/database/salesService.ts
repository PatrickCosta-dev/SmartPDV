import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '../store/cartStore';

export interface SaleItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  discount?: number; // Desconto fixo por item
  discountPercent?: number; // Desconto percentual por item
  notes?: string; // Observações por item
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // Total de descontos (incluindo por item, cupons, etc.)
  finalTotal: number;
  paymentMethod: string;
  customerName?: string;
  notes?: string;
  appliedCoupon?: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
  };
}

const SALES_STORAGE_KEY = '@smartpdv_sales';

class SalesDatabase {
  private sales: Sale[] = [];

  async init() {
    try {
      const savedSales = await AsyncStorage.getItem(SALES_STORAGE_KEY);
      if (savedSales) {
        this.sales = JSON.parse(savedSales);
      }
    } catch (error) {
      console.error('Erro ao inicializar banco de vendas:', error);
      this.sales = [];
    }
  }

  async saveSale(saleData: Omit<Sale, 'id' | 'date'>) {
    try {
      const sale: Sale = {
        ...saleData,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };

      this.sales.unshift(sale); // Adiciona no início da lista
      await this.persistSales();
      return sale;
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      throw error;
    }
  }

  async getAllSales(): Promise<Sale[]> {
    return [...this.sales];
  }

  async getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    return this.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return saleDate >= start && saleDate <= end;
    });
  }

  async getSalesByPaymentMethod(paymentMethod: string): Promise<Sale[]> {
    return this.sales.filter(sale => sale.paymentMethod === paymentMethod);
  }

  async getSalesByCustomer(customerName: string): Promise<Sale[]> {
    return this.sales.filter(sale => 
      sale.customerName?.toLowerCase().includes(customerName.toLowerCase())
    );
  }

  async deleteSale(saleId: string): Promise<boolean> {
    try {
      const initialLength = this.sales.length;
      this.sales = this.sales.filter(sale => sale.id !== saleId);
      
      if (this.sales.length < initialLength) {
        await this.persistSales();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao deletar venda:', error);
      return false;
    }
  }

  async getSalesStats() {
    const totalSales = this.sales.length;
    const totalRevenue = this.sales.reduce((sum, sale) => sum + sale.finalTotal, 0);
    const totalDiscounts = this.sales.reduce((sum, sale) => sum + sale.discount, 0);
    
    // Estatísticas por método de pagamento
    const paymentStats = this.sales.reduce((stats, sale) => {
      const method = sale.paymentMethod;
      if (!stats[method]) {
        stats[method] = { count: 0, total: 0 };
      }
      stats[method].count++;
      stats[method].total += sale.finalTotal;
      return stats;
    }, {} as Record<string, { count: number; total: number }>);

    // Produtos mais vendidos
    const productStats = this.sales.reduce((stats, sale) => {
      sale.items.forEach(item => {
        if (!stats[item.name]) {
          stats[item.name] = { quantity: 0, revenue: 0 };
        }
        stats[item.name].quantity += item.quantity;
        const itemTotal = (item.price * item.quantity) - (item.discount || 0);
        stats[item.name].revenue += itemTotal;
      });
      return stats;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    // Top 10 produtos mais vendidos
    const topProducts = Object.entries(productStats)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(([name, stats]) => ({ name, ...stats }));

    return {
      totalSales,
      totalRevenue,
      totalDiscounts,
      averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      paymentStats,
      topProducts,
    };
  }

  async getDailyStats(date: string) {
    const daySales = this.sales.filter(sale => 
      sale.date.startsWith(date)
    );

    const totalSales = daySales.length;
    const totalRevenue = daySales.reduce((sum, sale) => sum + sale.finalTotal, 0);
    const totalDiscounts = daySales.reduce((sum, sale) => sum + sale.discount, 0);

    return {
      date,
      totalSales,
      totalRevenue,
      totalDiscounts,
      averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
    };
  }

  async getMonthlyStats(year: number, month: number) {
    const monthSales = this.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate.getFullYear() === year && saleDate.getMonth() === month;
    });

    const totalSales = monthSales.length;
    const totalRevenue = monthSales.reduce((sum, sale) => sum + sale.finalTotal, 0);
    const totalDiscounts = monthSales.reduce((sum, sale) => sum + sale.discount, 0);

    // Vendas por dia do mês
    const dailyStats = monthSales.reduce((stats, sale) => {
      const day = new Date(sale.date).getDate();
      if (!stats[day]) {
        stats[day] = { sales: 0, revenue: 0 };
      }
      stats[day].sales++;
      stats[day].revenue += sale.finalTotal;
      return stats;
    }, {} as Record<number, { sales: number; revenue: number }>);

    return {
      year,
      month,
      totalSales,
      totalRevenue,
      totalDiscounts,
      averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      dailyStats,
    };
  }

  private async persistSales() {
    try {
      await AsyncStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(this.sales));
    } catch (error) {
      console.error('Erro ao persistir vendas:', error);
      throw error;
    }
  }

  async clearAllSales() {
    try {
      this.sales = [];
      await AsyncStorage.removeItem(SALES_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar vendas:', error);
      throw error;
    }
  }
}

export const salesDb = new SalesDatabase();

export function convertCartItemToSaleItem(cartItem: CartItem): SaleItem {
  return {
    id: cartItem.id,
    name: cartItem.name,
    price: cartItem.price,
    quantity: cartItem.quantity,
    discount: cartItem.discount,
    discountPercent: cartItem.discountPercent,
    notes: cartItem.notes,
  };
} 