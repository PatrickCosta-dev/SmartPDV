import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPurchase {
  id: string;
  customerId: string;
  saleId: string;
  amount: number;
  pointsEarned: number;
  date: string;
}

class CustomerService {
  private customersKey = 'smartpdv_customers';
  private customerPurchasesKey = 'smartpdv_customer_purchases';

  async init(): Promise<void> {
    try {
      const customers = await AsyncStorage.getItem(this.customersKey);
      if (!customers) {
        await AsyncStorage.setItem(this.customersKey, JSON.stringify([]));
      }

      const purchases = await AsyncStorage.getItem(this.customerPurchasesKey);
      if (!purchases) {
        await AsyncStorage.setItem(this.customerPurchasesKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Erro ao inicializar serviço de clientes:', error);
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      const customers = await AsyncStorage.getItem(this.customersKey);
      return customers ? JSON.parse(customers) : [];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const customers = await this.getAllCustomers();
      return customers.find(customer => customer.id === id) || null;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  }

  async addCustomer(customerData: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    try {
      const customers = await this.getAllCustomers();
      const newCustomer: Customer = {
        ...customerData,
        id: Date.now().toString(),
        loyaltyPoints: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      customers.push(newCustomer);
      await AsyncStorage.setItem(this.customersKey, JSON.stringify(customers));
      return newCustomer;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const customers = await this.getAllCustomers();
      const index = customers.findIndex(customer => customer.id === id);
      
      if (index === -1) return null;

      customers[index] = {
        ...customers[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.customersKey, JSON.stringify(customers));
      return customers[index];
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return null;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const customers = await this.getAllCustomers();
      const filteredCustomers = customers.filter(customer => customer.id !== id);
      await AsyncStorage.setItem(this.customersKey, JSON.stringify(filteredCustomers));
      return true;
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      return false;
    }
  }

  async addCustomerPurchase(purchase: Omit<CustomerPurchase, 'id'>): Promise<CustomerPurchase> {
    try {
      const purchases = await this.getAllCustomerPurchases();
      const newPurchase: CustomerPurchase = {
        ...purchase,
        id: Date.now().toString(),
      };

      purchases.push(newPurchase);
      await AsyncStorage.setItem(this.customerPurchasesKey, JSON.stringify(purchases));

      // Atualizar pontos de fidelidade do cliente
      const customer = await this.getCustomerById(purchase.customerId);
      if (customer) {
        const pointsToAdd = Math.floor(purchase.amount / 10); // 1 ponto a cada R$ 10
        await this.updateCustomer(purchase.customerId, {
          loyaltyPoints: customer.loyaltyPoints + pointsToAdd,
          totalSpent: customer.totalSpent + purchase.amount,
        });
      }

      return newPurchase;
    } catch (error) {
      console.error('Erro ao adicionar compra do cliente:', error);
      throw error;
    }
  }

  async getAllCustomerPurchases(): Promise<CustomerPurchase[]> {
    try {
      const purchases = await AsyncStorage.getItem(this.customerPurchasesKey);
      return purchases ? JSON.parse(purchases) : [];
    } catch (error) {
      console.error('Erro ao buscar compras dos clientes:', error);
      return [];
    }
  }

  async getCustomerPurchases(customerId: string): Promise<CustomerPurchase[]> {
    try {
      const purchases = await this.getAllCustomerPurchases();
      return purchases.filter(purchase => purchase.customerId === customerId);
    } catch (error) {
      console.error('Erro ao buscar compras do cliente:', error);
      return [];
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const customers = await this.getAllCustomers();
      const lowerQuery = query.toLowerCase();
      
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.email.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(query) ||
        customer.cpf.includes(query)
      );
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }

  async useLoyaltyPoints(customerId: string, pointsToUse: number): Promise<boolean> {
    try {
      const customer = await this.getCustomerById(customerId);
      if (!customer || customer.loyaltyPoints < pointsToUse) {
        return false;
      }

      await this.updateCustomer(customerId, {
        loyaltyPoints: customer.loyaltyPoints - pointsToUse,
      });

      return true;
    } catch (error) {
      console.error('Erro ao usar pontos de fidelidade:', error);
      return false;
    }
  }
}

export const customerService = new CustomerService(); 