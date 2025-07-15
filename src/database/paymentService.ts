import AsyncStorage from '@react-native-async-storage/async-storage';

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'vale';

export interface Payment {
  id: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number; // Para pagamento em dinheiro
  change?: number; // Troco
  pixKey?: string; // Chave PIX
  cardLastDigits?: string; // Últimos dígitos do cartão
  installments?: number; // Parcelas
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  transactionId?: string; // ID da transação externa
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  paymentId: string;
  saleId: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  receivedAmount?: number;
  change?: number;
  date: string;
  receiptNumber: string;
}

class PaymentService {
  private paymentsKey = 'smartpdv_payments';
  private receiptsKey = 'smartpdv_receipts';
  private receiptCounterKey = 'smartpdv_receipt_counter';

  async init(): Promise<void> {
    try {
      const payments = await AsyncStorage.getItem(this.paymentsKey);
      if (!payments) {
        await AsyncStorage.setItem(this.paymentsKey, JSON.stringify([]));
      }

      const receipts = await AsyncStorage.getItem(this.receiptsKey);
      if (!receipts) {
        await AsyncStorage.setItem(this.receiptsKey, JSON.stringify([]));
      }

      const counter = await AsyncStorage.getItem(this.receiptCounterKey);
      if (!counter) {
        await AsyncStorage.setItem(this.receiptCounterKey, '1000');
      }
    } catch (error) {
      console.error('Erro ao inicializar serviço de pagamentos:', error);
    }
  }

  async createPayment(paymentData: Omit<Payment, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    try {
      const payments = await this.getAllPayments();
      const newPayment: Payment = {
        ...paymentData,
        id: Date.now().toString(),
        status: 'pendente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Processar pagamento baseado no método
      await this.processPayment(newPayment);

      payments.push(newPayment);
      await AsyncStorage.setItem(this.paymentsKey, JSON.stringify(payments));
      return newPayment;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw error;
    }
  }

  private async processPayment(payment: Payment): Promise<void> {
    try {
      switch (payment.method) {
        case 'dinheiro':
          if (payment.receivedAmount && payment.receivedAmount >= payment.amount) {
            payment.change = payment.receivedAmount - payment.amount;
            payment.status = 'aprovado';
          } else {
            payment.status = 'rejeitado';
          }
          break;

        case 'pix':
          // Simular processamento PIX
          if (payment.pixKey && payment.pixKey.trim()) {
            payment.status = 'aprovado';
            payment.transactionId = `PIX_${Date.now()}`;
          } else {
            payment.status = 'rejeitado';
          }
          break;

        case 'cartao_credito':
        case 'cartao_debito':
          // Simular processamento de cartão
          payment.status = 'aprovado';
          payment.transactionId = `CARD_${Date.now()}`;
          break;

        case 'vale':
          // Simular processamento de vale
          payment.status = 'aprovado';
          payment.transactionId = `VALE_${Date.now()}`;
          break;

        default:
          payment.status = 'rejeitado';
      }

      payment.updatedAt = new Date().toISOString();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      payment.status = 'rejeitado';
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    try {
      const payments = await AsyncStorage.getItem(this.paymentsKey);
      return payments ? JSON.parse(payments) : [];
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const payments = await this.getAllPayments();
      return payments.find(payment => payment.id === id) || null;
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      return null;
    }
  }

  async getPaymentsBySale(saleId: string): Promise<Payment[]> {
    try {
      const payments = await this.getAllPayments();
      return payments.filter(payment => payment.saleId === saleId);
    } catch (error) {
      console.error('Erro ao buscar pagamentos da venda:', error);
      return [];
    }
  }

  async updatePaymentStatus(id: string, status: Payment['status']): Promise<boolean> {
    try {
      const payments = await this.getAllPayments();
      const index = payments.findIndex(payment => payment.id === id);
      
      if (index === -1) return false;

      payments[index].status = status;
      payments[index].updatedAt = new Date().toISOString();

      await AsyncStorage.setItem(this.paymentsKey, JSON.stringify(payments));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento:', error);
      return false;
    }
  }

  async calculateChange(amount: number, receivedAmount: number): Promise<number> {
    return Math.max(0, receivedAmount - amount);
  }

  async generateReceipt(receiptData: Omit<PaymentReceipt, 'id' | 'receiptNumber' | 'date'>): Promise<PaymentReceipt> {
    try {
      const receipts = await this.getAllReceipts();
      const counter = await this.getNextReceiptNumber();
      
      const newReceipt: PaymentReceipt = {
        ...receiptData,
        id: Date.now().toString(),
        receiptNumber: counter.toString(),
        date: new Date().toISOString(),
      };

      receipts.push(newReceipt);
      await AsyncStorage.setItem(this.receiptsKey, JSON.stringify(receipts));
      return newReceipt;
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error);
      throw error;
    }
  }

  private async getNextReceiptNumber(): Promise<number> {
    try {
      const counter = await AsyncStorage.getItem(this.receiptCounterKey);
      const nextNumber = parseInt(counter || '1000') + 1;
      await AsyncStorage.setItem(this.receiptCounterKey, nextNumber.toString());
      return nextNumber;
    } catch (error) {
      console.error('Erro ao gerar número do comprovante:', error);
      return Date.now();
    }
  }

  async getAllReceipts(): Promise<PaymentReceipt[]> {
    try {
      const receipts = await AsyncStorage.getItem(this.receiptsKey);
      return receipts ? JSON.parse(receipts) : [];
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error);
      return [];
    }
  }

  async getReceiptById(id: string): Promise<PaymentReceipt | null> {
    try {
      const receipts = await this.getAllReceipts();
      return receipts.find(receipt => receipt.id === id) || null;
    } catch (error) {
      console.error('Erro ao buscar comprovante:', error);
      return null;
    }
  }

  async getReceiptsBySale(saleId: string): Promise<PaymentReceipt[]> {
    try {
      const receipts = await this.getAllReceipts();
      return receipts.filter(receipt => receipt.saleId === saleId);
    } catch (error) {
      console.error('Erro ao buscar comprovantes da venda:', error);
      return [];
    }
  }

  async getPaymentReport(startDate?: string, endDate?: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    paymentsByMethod: Record<PaymentMethod, { count: number; amount: number }>;
    averageTicket: number;
    payments: Payment[];
  }> {
    try {
      const payments = await this.getAllPayments();
      
      let filteredPayments = payments;
      if (startDate && endDate) {
        filteredPayments = payments.filter(payment => 
          payment.createdAt >= startDate && payment.createdAt <= endDate
        );
      }

      const approvedPayments = filteredPayments.filter(p => p.status === 'aprovado');
      const totalAmount = approvedPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const paymentsByMethod: Record<PaymentMethod, { count: number; amount: number }> = {
        dinheiro: { count: 0, amount: 0 },
        pix: { count: 0, amount: 0 },
        cartao_credito: { count: 0, amount: 0 },
        cartao_debito: { count: 0, amount: 0 },
        vale: { count: 0, amount: 0 },
      };

      approvedPayments.forEach(payment => {
        paymentsByMethod[payment.method].count++;
        paymentsByMethod[payment.method].amount += payment.amount;
      });

      return {
        totalPayments: approvedPayments.length,
        totalAmount,
        paymentsByMethod,
        averageTicket: approvedPayments.length > 0 ? totalAmount / approvedPayments.length : 0,
        payments: filteredPayments,
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de pagamentos:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        paymentsByMethod: {
          dinheiro: { count: 0, amount: 0 },
          pix: { count: 0, amount: 0 },
          cartao_credito: { count: 0, amount: 0 },
          cartao_debito: { count: 0, amount: 0 },
          vale: { count: 0, amount: 0 },
        },
        averageTicket: 0,
        payments: [],
      };
    }
  }

  // Métodos auxiliares para validação
  validatePixKey(key: string): boolean {
    // Validação básica de chave PIX
    return key.length >= 10;
  }

  validateCardNumber(number: string): boolean {
    // Validação básica de número de cartão (algoritmo de Luhn)
    const digits = number.replace(/\D/g, '').split('').map(Number);
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = digits[i];
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  maskCardNumber(number: string): string {
    const digits = number.replace(/\D/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  getLastDigits(number: string): string {
    const digits = number.replace(/\D/g, '');
    return digits.slice(-4);
  }
}

export const paymentService = new PaymentService(); 