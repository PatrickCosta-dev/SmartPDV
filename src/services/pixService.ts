<<<<<<< HEAD
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'qrcode';
import { Platform } from 'react-native';

export interface PixData {
  key: string;
  keyType: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  merchantName: string;
  merchantCity: string;
  amount?: number;
  description?: string;
  transactionId?: string;
}

export interface PixQRCode {
  qrCodeData: string;
  qrCodeImage: string;
  copyAndPaste: string;
}

=======
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

>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
export interface PixConfig {
  pixKey: string;
  pixKeyType: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  beneficiaryName: string;
  beneficiaryCity: string;
<<<<<<< HEAD
}

export class PixService {
  private static readonly PIX_VERSION = '01';
  private static readonly MERCHANT_CATEGORY_CODE = '0000';
  private static readonly COUNTRY_CODE = 'BR';
  private static readonly CURRENCY_CODE = '986';
  private static readonly CONFIG_STORAGE_KEY = '@smartpdv_pix_config';

  // Configuração padrão
  private static defaultConfig: PixConfig = {
=======
  merchantId?: string; // Para integração com APIs
  apiKey?: string; // Para integração com APIs
}

class PixService {
  private config: PixConfig = {
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
    pixKey: 'smartpdv@exemplo.com',
    pixKeyType: 'email',
    beneficiaryName: 'SmartPDV Store',
    beneficiaryCity: 'SAO PAULO'
  };

  /**
<<<<<<< HEAD
   * Carrega configurações PIX do storage
   */
  static async loadConfig(): Promise<PixConfig> {
    try {
      console.log('Carregando configurações PIX do AsyncStorage...');
      const stored = await AsyncStorage.getItem(this.CONFIG_STORAGE_KEY);
      console.log('Dados brutos do AsyncStorage:', stored);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('Configurações PIX carregadas:', parsed);
        return parsed;
      }
      
      console.log('Nenhuma configuração encontrada, usando padrão:', this.defaultConfig);
      return this.defaultConfig;
    } catch (error) {
      console.error('Erro ao carregar configurações PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Detalhes do erro:', errorMessage);
      return this.defaultConfig;
    }
  }

  /**
   * Salva configurações PIX no storage
   */
  static async saveConfig(config: PixConfig): Promise<void> {
    try {
      console.log('Salvando configurações PIX:', config);
      const configString = JSON.stringify(config);
      console.log('Configuração serializada:', configString);
      
      await AsyncStorage.setItem(this.CONFIG_STORAGE_KEY, configString);
      console.log('Configurações PIX salvas com sucesso no AsyncStorage');
      
      // Verificar se foi salvo corretamente
      const saved = await AsyncStorage.getItem(this.CONFIG_STORAGE_KEY);
      console.log('Verificação - dados salvos:', saved);
      
    } catch (error) {
      console.error('Erro ao salvar configurações PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao salvar configurações PIX: ${errorMessage}`);
    }
  }

  /**
   * Gera dados do PIX para QR Code
   */
  static generatePixData(data: PixData): string {
    const {
      key,
      keyType,
      merchantName,
      merchantCity,
      amount,
      description,
      transactionId
    } = data;

    const payload = [
      this.createEMVField('00', '01'), // Payload Format Indicator
      this.createEMVField('01', '12'), // Point of Initiation Method
      this.createEMVField('26', [
        this.createEMVField('00', 'br.gov.bcb.pix'), // GUI
        this.createEMVField('01', key), // Chave PIX
      ].join('')),
      this.createEMVField('52', this.MERCHANT_CATEGORY_CODE),
      this.createEMVField('53', this.CURRENCY_CODE),
      amount ? this.createEMVField('54', amount.toFixed(2)) : '',
      this.createEMVField('58', this.COUNTRY_CODE),
      this.createEMVField('59', merchantName),
      this.createEMVField('60', merchantCity),
      transactionId ? this.createEMVField('62', [
        this.createEMVField('05', transactionId)
      ].join('')) : '',
      description ? this.createEMVField('80', description) : ''
    ].filter(Boolean).join('');

    return payload;
  }

  /**
   * Gera dados do PIX usando configurações salvas
   */
  static async generatePixDataWithConfig(amount: number, description?: string): Promise<string> {
    const config = await this.loadConfig();
    
    const pixData: PixData = {
      key: config.pixKey,
      keyType: config.pixKeyType,
      merchantName: config.beneficiaryName,
      merchantCity: config.beneficiaryCity,
      amount,
      description: description || `Pagamento SmartPDV - R$ ${amount.toFixed(2)}`,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    return this.generatePixData(pixData);
  }

  /**
   * Cria campo EMV
   */
  private static createEMVField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  }

  /**
   * Gera QR Code PIX
   */
  static async generatePixQRCode(data: PixData): Promise<PixQRCode> {
    try {
      const pixData = this.generatePixData(data);
      
      // Gera QR Code como imagem
      const qrCodeImage = await QRCode.toDataURL(pixData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrCodeData: pixData,
        qrCodeImage,
        copyAndPaste: pixData
      };
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      throw new Error('Falha ao gerar QR Code PIX');
    }
  }

  /**
   * Gera QR Code PIX usando configurações salvas
   */
  static async generatePixQRCodeWithConfig(amount: number, description?: string): Promise<PixQRCode> {
    const config = await this.loadConfig();
    
    const pixData: PixData = {
      key: config.pixKey,
      keyType: config.pixKeyType,
      merchantName: config.beneficiaryName,
      merchantCity: config.beneficiaryCity,
      amount,
      description: description || `Pagamento SmartPDV - R$ ${amount.toFixed(2)}`,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    return this.generatePixQRCode(pixData);
  }

  /**
   * Valida chave PIX
   */
  static validatePixKey(key: string, keyType: string): boolean {
    switch (keyType) {
      case 'email':
        return this.isValidEmail(key);
      case 'cpf':
        return this.isValidCPF(key);
      case 'cnpj':
        return this.isValidCNPJ(key);
      case 'phone':
        return this.isValidPhone(key);
      case 'random':
        return key.length === 32 && /^[a-zA-Z0-9]+$/.test(key);
      default:
        return false;
    }
  }

  /**
   * Valida email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida CPF
   */
  private static isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  /**
   * Valida CNPJ
   */
  private static isValidCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
    
    return true;
  }

  /**
   * Valida telefone
   */
  private static isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  /**
   * Simula verificação de pagamento PIX
   */
  static async checkPixPayment(transactionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    amount?: number;
    timestamp?: string;
  }> {
    // Simulação de verificação de pagamento
    // Em produção, isso seria uma chamada para API do banco
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simula 70% de chance de pagamento aprovado
        const isApproved = Math.random() > 0.3;
        resolve({
          status: isApproved ? 'completed' : 'pending',
          amount: isApproved ? Math.random() * 1000 : undefined,
          timestamp: isApproved ? new Date().toISOString() : undefined
        });
      }, 2000);
    });
  }

  /**
   * Gera chave PIX aleatória
   */
  static generateRandomPixKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Formata valor para PIX
   */
  static formatPixAmount(amount: number): string {
    return amount.toFixed(2).replace('.', '');
  }

  /**
   * Copia dados PIX para área de transferência
   */
  static async copyPixToClipboard(pixData: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(pixData);
      } catch (error) {
        console.error('Erro ao copiar para área de transferência:', error);
        throw new Error('Falha ao copiar dados PIX');
      }
    } else {
      // Para React Native, usar expo-clipboard ou similar
      console.log('Dados PIX para copiar:', pixData);
    }
  }
} 
=======
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
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
