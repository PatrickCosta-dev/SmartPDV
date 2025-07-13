import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'qrcode';
import { Platform } from 'react-native';

export interface PixData {
  key: string;
  keyType: 'cnpj';
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

export interface PixConfig {
  pixKey: string;
  pixKeyType: 'cnpj';
  beneficiaryName: string;
  beneficiaryCity: string;
}

export class PixService {
  private static readonly PIX_VERSION = '01';
  private static readonly MERCHANT_CATEGORY_CODE = '0000';
  private static readonly COUNTRY_CODE = 'BR';
  private static readonly CURRENCY_CODE = '986';
  private static readonly CONFIG_STORAGE_KEY = '@smartpdv_pix_config';

  // Configuração padrão - apenas CNPJ
  private static defaultConfig: PixConfig = {
    pixKey: '58631747000128',
    pixKeyType: 'cnpj',
    beneficiaryName: 'SmartPDV Store',
    beneficiaryCity: 'SAO PAULO'
  };

  /**
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
   * Valida chave PIX CNPJ
   */
  static validatePixKey(key: string, keyType: string): boolean {
    if (keyType !== 'cnpj') {
      return false; // Apenas CNPJ é suportado
    }
    return this.isValidCNPJ(key);
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
   * Formata CNPJ para exibição
   */
  static formatCNPJ(cnpj: string): string {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  /**
   * Remove formatação do CNPJ
   */
  static cleanCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  /**
   * Verifica pagamento PIX (simulado)
   */
  static async checkPixPayment(transactionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    amount?: number;
    timestamp?: string;
  }> {
    // Simulação de verificação de pagamento
    // Em produção, isso seria integrado com APIs bancárias
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simula 70% de chance de pagamento bem-sucedido
        const isSuccess = Math.random() > 0.3;
        resolve({
          status: isSuccess ? 'completed' : 'pending',
          amount: isSuccess ? 10.00 : undefined,
          timestamp: isSuccess ? new Date().toISOString() : undefined
        });
      }, 2000);
    });
  }

  /**
   * Formata valor PIX
   */
  static formatPixAmount(amount: number): string {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Copia dados PIX para clipboard
   */
  static async copyPixToClipboard(pixData: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(pixData);
      } catch (error) {
        console.error('Erro ao copiar para clipboard:', error);
      }
    } else {
      // Para React Native, seria necessário usar @react-native-clipboard/clipboard
      console.log('Dados PIX para copiar:', pixData);
    }
  }
}
