import QRCode from 'qrcode';
import type { Sale } from '../database/salesService';

export interface PixPaymentData {
  id: string;
  saleId: string;
  amount: number;
  qrCode: string;
  qrCodeText: string;
  pixKey: string;
  pixKeyType: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  beneficiaryName: string;
  beneficiaryCity: string;
  description: string;
  expiresAt: Date;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
  transactionId?: string;
}

export interface PixConfig {
  pixKey: string;
  pixKeyType: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  beneficiaryName: string;
  beneficiaryCity: string;
  merchantId?: string; // Para integração com APIs
  apiKey?: string; // Para integração com APIs
}

class PixService {
  private config: PixConfig = {
    pixKey: 'smartpdv@exemplo.com',
    pixKeyType: 'email',
    beneficiaryName: 'SmartPDV Store',
    beneficiaryCity: 'SAO PAULO'
  };

  /**
   * Configura as informações PIX da empresa
   */
  setConfig(config: Partial<PixConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gera dados PIX para uma venda
   */
  async generatePixPayment(sale: Sale): Promise<PixPaymentData> {
    const paymentId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Gera o payload PIX (formato EMV QR Code)
    const pixPayload = this.generatePixPayload(sale, paymentId);
    
    // Gera o QR Code
    const qrCode = await QRCode.toDataURL(pixPayload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const paymentData: PixPaymentData = {
      id: paymentId,
      saleId: sale.id,
      amount: sale.finalTotal,
      qrCode,
      qrCodeText: pixPayload,
      pixKey: this.config.pixKey,
      pixKeyType: this.config.pixKeyType,
      beneficiaryName: this.config.beneficiaryName,
      beneficiaryCity: this.config.beneficiaryCity,
      description: `Venda #${sale.id} - SmartPDV`,
      expiresAt,
      status: 'pending',
      createdAt: new Date()
    };

    // Salva o pagamento no storage
    await this.savePixPayment(paymentData);

    return paymentData;
  }

  /**
   * Gera o payload PIX no formato EMV QR Code
   */
  private generatePixPayload(sale: Sale, paymentId: string): string {
    const amount = sale.finalTotal.toFixed(2);
    const description = `Venda #${sale.id}`;
    
    // Formato EMV QR Code para PIX
    const payload = [
      '000201', // Payload Format Indicator
      '010212', // Point of Initiation Method (12 = QR Code)
      '2652', // Merchant Account Information
      this.generateMerchantAccountInfo(),
      '52040000', // Merchant Category Code (0000 = General)
      '5303986', // Transaction Currency (986 = BRL)
      `54${amount.length.toString().padStart(2, '0')}${amount}`, // Transaction Amount
      '5802BR', // Country Code
      '5913', // Merchant Name
      this.config.beneficiaryName,
      '6001', // Merchant City
      this.config.beneficiaryCity,
      '62070503', // Additional Data Field Template
      `***${paymentId}`, // Reference Label
      '6304' // CRC16
    ].join('');

    // Calcula CRC16
    const crc = this.calculateCRC16(payload);
    return payload + crc;
  }

  /**
   * Gera informações da conta do comerciante
   */
  private generateMerchantAccountInfo(): string {
    const pixKey = this.config.pixKey;
    const pixKeyType = this.getPixKeyTypeCode();
    
    const gui = '0014BR.GOV.BCB.PIX'; // GUI do PIX
    const pixKeyData = `${pixKeyType}${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
    
    return `${gui.length.toString().padStart(2, '0')}${gui}${pixKeyData}`;
  }

  /**
   * Retorna o código do tipo de chave PIX
   */
  private getPixKeyTypeCode(): string {
    const types = {
      'email': '01',
      'cpf': '02', 
      'cnpj': '03',
      'phone': '04',
      'random': '05'
    };
    return types[this.config.pixKeyType] || '01';
  }

  /**
   * Calcula CRC16 para validação
   */
  private calculateCRC16(payload: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
      }
    }

    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Verifica status do pagamento (simulado)
   */
  async checkPaymentStatus(paymentId: string): Promise<PixPaymentData | null> {
    try {
      const payment = await this.getPixPayment(paymentId);
      if (!payment) return null;

      // Simula verificação de status (em produção, faria chamada para API)
      if (payment.status === 'pending' && new Date() > payment.expiresAt) {
        payment.status = 'expired';
        await this.updatePixPayment(payment);
      }

      return payment;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return null;
    }
  }

  /**
   * Simula pagamento confirmado (para testes)
   */
  async simulatePayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.getPixPayment(paymentId);
      if (!payment || payment.status !== 'pending') return false;

      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.transactionId = `txn_${Date.now()}`;

      await this.updatePixPayment(payment);
      return true;
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      return false;
    }
  }

  /**
   * Cancela um pagamento PIX
   */
  async cancelPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await this.getPixPayment(paymentId);
      if (!payment || payment.status !== 'pending') return false;

      payment.status = 'cancelled';
      await this.updatePixPayment(payment);
      return true;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      return false;
    }
  }

  /**
   * Lista todos os pagamentos PIX
   */
  async getAllPayments(): Promise<PixPaymentData[]> {
    try {
      const storage = await this.getStorage();
      const payments = storage.getItem('pix_payments');
      return payments ? JSON.parse(payments) : [];
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      return [];
    }
  }

  /**
   * Busca pagamentos por venda
   */
  async getPaymentsBySale(saleId: string): Promise<PixPaymentData[]> {
    const allPayments = await this.getAllPayments();
    return allPayments.filter(payment => payment.saleId === saleId);
  }

  /**
   * Salva pagamento PIX
   */
  private async savePixPayment(payment: PixPaymentData): Promise<void> {
    try {
      const storage = await this.getStorage();
      const payments = await this.getAllPayments();
      payments.push(payment);
      storage.setItem('pix_payments', JSON.stringify(payments));
    } catch (error) {
      console.error('Erro ao salvar pagamento PIX:', error);
    }
  }

  /**
   * Atualiza pagamento PIX
   */
  private async updatePixPayment(updatedPayment: PixPaymentData): Promise<void> {
    try {
      const storage = await this.getStorage();
      const payments = await this.getAllPayments();
      const index = payments.findIndex(p => p.id === updatedPayment.id);
      
      if (index !== -1) {
        payments[index] = updatedPayment;
        storage.setItem('pix_payments', JSON.stringify(payments));
      }
    } catch (error) {
      console.error('Erro ao atualizar pagamento PIX:', error);
    }
  }

  /**
   * Busca pagamento PIX por ID
   */
  private async getPixPayment(paymentId: string): Promise<PixPaymentData | null> {
    try {
      const payments = await this.getAllPayments();
      return payments.find(p => p.id === paymentId) || null;
    } catch (error) {
      console.error('Erro ao buscar pagamento PIX:', error);
      return null;
    }
  }

  /**
   * Obtém storage baseado na plataforma
   */
  private async getStorage() {
    if (typeof window !== 'undefined') {
      // Web
      return localStorage;
    } else {
      // React Native
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage;
    }
  }

  /**
   * Gera estatísticas de pagamentos PIX
   */
  async getPixStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    pendingPayments: number;
    paidPayments: number;
    expiredPayments: number;
    averageAmount: number;
  }> {
    const payments = await this.getAllPayments();
    
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const expiredPayments = payments.filter(p => p.status === 'expired').length;
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    return {
      totalPayments,
      totalAmount,
      pendingPayments,
      paidPayments,
      expiredPayments,
      averageAmount
    };
  }

  /**
   * Limpa pagamentos expirados
   */
  async cleanupExpiredPayments(): Promise<number> {
    try {
      const storage = await this.getStorage();
      const payments = await this.getAllPayments();
      const now = new Date();
      
      const validPayments = payments.filter(payment => {
        if (payment.status === 'pending' && now > payment.expiresAt) {
          payment.status = 'expired';
        }
        return payment.status !== 'expired' || 
               (now.getTime() - payment.expiresAt.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 dias
      });

      storage.setItem('pix_payments', JSON.stringify(validPayments));
      return payments.length - validPayments.length;
    } catch (error) {
      console.error('Erro ao limpar pagamentos expirados:', error);
      return 0;
    }
  }
}

export const pixService = new PixService(); 