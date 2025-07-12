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

export class PixService {
  private static readonly PIX_VERSION = '01';
  private static readonly MERCHANT_CATEGORY_CODE = '0000';
  private static readonly COUNTRY_CODE = 'BR';
  private static readonly CURRENCY_CODE = '986';

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
        this.createEMVField('00', merchantName),
        this.createEMVField('01', merchantCity),
        this.createEMVField('02', keyType),
        this.createEMVField('03', key),
        this.createEMVField('04', this.MERCHANT_CATEGORY_CODE)
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