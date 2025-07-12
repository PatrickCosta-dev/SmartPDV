import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Customer } from '../database/customerService';
import type { Product } from '../database/productService';
import type { Sale } from '../database/salesService';
import type { PixPaymentData } from './pixService';

export interface CloudBackup {
  id: string;
  timestamp: Date;
  version: string;
  size: number;
  description: string;
  data: {
    products: Product[];
    sales: Sale[];
    customers: Customer[];
    pixPayments: PixPaymentData[];
    settings: any;
  };
  checksum: string;
}

export interface SyncConfig {
  autoBackup: boolean;
  backupInterval: number; // em horas
  maxBackups: number;
  cloudProvider: 'local' | 'google-drive' | 'dropbox' | 'onedrive';
  lastSync: Date | null;
  syncEnabled: boolean;
}

export interface SyncStats {
  totalBackups: number;
  lastBackup: Date | null;
  totalSize: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastError: string | null;
}

class CloudSyncService {
  private config: SyncConfig = {
    autoBackup: true,
    backupInterval: 24, // 24 horas
    maxBackups: 10,
    cloudProvider: 'local',
    lastSync: null,
    syncEnabled: true
  };

  private backupDir = `${FileSystem.documentDirectory}backups/`;

  constructor() {
    this.initializeBackupDirectory();
  }

  /**
   * Inicializa o diretório de backup
   */
  private async initializeBackupDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.backupDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao inicializar diretório de backup:', error);
    }
  }

  /**
   * Configura as opções de sincronização
   */
  setConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): SyncConfig {
    return this.config;
  }

  /**
   * Cria um backup completo dos dados
   */
  async createBackup(description?: string): Promise<CloudBackup> {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();
      
      // Coleta todos os dados
      const data = await this.collectAllData();
      
      // Calcula checksum para integridade
      const checksum = await this.calculateChecksum(JSON.stringify(data));
      
      const backup: CloudBackup = {
        id: backupId,
        timestamp,
        version: '1.0.0',
        size: JSON.stringify(data).length,
        description: description || `Backup automático - ${timestamp.toLocaleString('pt-BR')}`,
        data,
        checksum
      };

      // Salva o backup localmente
      await this.saveBackupLocally(backup);
      
      // Atualiza configuração
      this.config.lastSync = timestamp;
      
      // Limpa backups antigos se necessário
      await this.cleanupOldBackups();
      
      return backup;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw new Error('Falha ao criar backup');
    }
  }

  /**
   * Coleta todos os dados do sistema
   */
  private async collectAllData() {
    try {
      // Importa os serviços dinamicamente para evitar dependências circulares
      const { db: productDb } = await import('../database/productService');
      const { salesDb } = await import('../database/salesService');
      const { customerService } = await import('../database/customerService');
      const { pixService } = await import('./pixService');

      // Inicializa os bancos
      await productDb.initDatabase();
      await salesDb.init();
      await customerService.init();

      // Coleta dados
      const products = await productDb.getAllProducts();
      const sales = await salesDb.getAllSales();
      const customers = await customerService.getAllCustomers();
      const pixPayments = await pixService.getAllPayments();
      
      // Configurações (simuladas)
      const settings = {
        pixConfig: {
          pixKey: 'smartpdv@exemplo.com',
          pixKeyType: 'email',
          beneficiaryName: 'SmartPDV Store',
          beneficiaryCity: 'SAO PAULO'
        },
        appSettings: {
          autoBackup: this.config.autoBackup,
          notifications: true,
          soundEnabled: true
        }
      };

      return {
        products,
        sales,
        customers,
        pixPayments,
        settings
      };
    } catch (error) {
      console.error('Erro ao coletar dados:', error);
      throw new Error('Falha ao coletar dados para backup');
    }
  }

  /**
   * Calcula checksum dos dados
   */
  private async calculateChecksum(data: string): Promise<string> {
    // Implementação simples de checksum (em produção, usar crypto)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converte para 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Salva backup localmente
   */
  private async saveBackupLocally(backup: CloudBackup): Promise<void> {
    try {
      const backupPath = `${this.backupDir}${backup.id}.json`;
      await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(backup, null, 2));
    } catch (error) {
      console.error('Erro ao salvar backup local:', error);
      throw new Error('Falha ao salvar backup local');
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(): Promise<CloudBackup[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const backups: CloudBackup[] = [];
      
      for (const file of backupFiles) {
        try {
          const filePath = `${this.backupDir}${file}`;
          const content = await FileSystem.readAsStringAsync(filePath);
          const backup = JSON.parse(content);
          backups.push(backup);
        } catch (error) {
          console.error(`Erro ao ler backup ${file}:`, error);
        }
      }
      
      // Ordena por timestamp (mais recente primeiro)
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  /**
   * Restaura dados de um backup
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      // Busca o backup
      const backups = await this.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error('Backup não encontrado');
      }

      // Valida checksum
      const currentChecksum = await this.calculateChecksum(JSON.stringify(backup.data));
      if (currentChecksum !== backup.checksum) {
        throw new Error('Backup corrompido - checksum inválido');
      }

      // Restaura os dados
      await this.restoreData(backup.data);
      
      return true;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  /**
   * Restaura dados nos bancos
   */
  private async restoreData(data: CloudBackup['data']): Promise<void> {
    try {
      // Importa os serviços
      const { db: productDb } = await import('../database/productService');
      const { salesDb } = await import('../database/salesService');
      const { customerService } = await import('../database/customerService');
      const { pixService } = await import('./pixService');

      // Inicializa os bancos
      await productDb.initDatabase();
      await salesDb.init();
      await customerService.init();

      // Limpa dados existentes (simulado - em produção implementar clearAll)
      // await productDb.clearAll();
      // await salesDb.clearAll();
      // await customerService.clearAll();

      // Restaura produtos
      for (const product of data.products) {
        await productDb.addProduct(product);
      }

      // Restaura vendas
      for (const sale of data.sales) {
        await salesDb.saveSale(sale);
      }

      // Restaura clientes
      for (const customer of data.customers) {
        await customerService.addCustomer(customer);
      }

      // Restaura configurações PIX
      if (data.settings.pixConfig) {
        pixService.setConfig(data.settings.pixConfig);
      }

    } catch (error) {
      console.error('Erro ao restaurar dados:', error);
      throw new Error('Falha ao restaurar dados');
    }
  }

  /**
   * Exporta backup para arquivo
   */
  async exportBackup(backupId: string): Promise<void> {
    try {
      const backups = await this.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error('Backup não encontrado');
      }

      const backupPath = `${this.backupDir}${backupId}.json`;
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupPath, {
          mimeType: 'application/json',
          dialogTitle: `Backup SmartPDV - ${backup.description}`
        });
      }
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      throw error;
    }
  }

  /**
   * Importa backup de arquivo
   */
  async importBackup(): Promise<boolean> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets[0]) {
        return false;
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      const backup: CloudBackup = JSON.parse(content);

      // Valida o backup
      if (!backup.id || !backup.data || !backup.checksum) {
        throw new Error('Arquivo de backup inválido');
      }

      // Valida checksum
      const currentChecksum = await this.calculateChecksum(JSON.stringify(backup.data));
      if (currentChecksum !== backup.checksum) {
        throw new Error('Backup corrompido - checksum inválido');
      }

      // Restaura o backup
      await this.restoreData(backup.data);
      
      return true;
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      throw error;
    }
  }

  /**
   * Remove backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupPath = `${this.backupDir}${backupId}.json`;
      await FileSystem.deleteAsync(backupPath);
      return true;
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      return false;
    }
  }

  /**
   * Limpa backups antigos
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.config.maxBackups) {
        const backupsToDelete = backups.slice(this.config.maxBackups);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar backups antigos:', error);
    }
  }

  /**
   * Verifica se precisa fazer backup automático
   */
  async checkAutoBackup(): Promise<boolean> {
    if (!this.config.autoBackup || !this.config.lastSync) {
      return false;
    }

    const now = new Date();
    const lastSync = new Date(this.config.lastSync);
    const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastSync >= this.config.backupInterval;
  }

  /**
   * Executa backup automático se necessário
   */
  async runAutoBackup(): Promise<CloudBackup | null> {
    try {
      if (await this.checkAutoBackup()) {
        return await this.createBackup('Backup automático');
      }
      return null;
    } catch (error) {
      console.error('Erro no backup automático:', error);
      return null;
    }
  }

  /**
   * Obtém estatísticas de sincronização
   */
  async getSyncStats(): Promise<SyncStats> {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        totalBackups: backups.length,
        lastBackup: backups.length > 0 ? new Date(backups[0].timestamp) : null,
        totalSize,
        syncStatus: 'idle',
        lastError: null
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalBackups: 0,
        lastBackup: null,
        totalSize: 0,
        syncStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Compara dois backups
   */
  async compareBackups(backupId1: string, backupId2: string): Promise<{
    products: { added: number; removed: number; modified: number };
    sales: { added: number; removed: number; modified: number };
    customers: { added: number; removed: number; modified: number };
  }> {
    try {
      const backups = await this.listBackups();
      const backup1 = backups.find(b => b.id === backupId1);
      const backup2 = backups.find(b => b.id === backupId2);

      if (!backup1 || !backup2) {
        throw new Error('Backup não encontrado');
      }

      // Compara produtos
      const productsDiff = this.compareArrays(backup1.data.products, backup2.data.products, 'id');
      
      // Compara vendas
      const salesDiff = this.compareArrays(backup1.data.sales, backup2.data.sales, 'id');
      
      // Compara clientes
      const customersDiff = this.compareArrays(backup1.data.customers, backup2.data.customers, 'id');

      return {
        products: productsDiff,
        sales: salesDiff,
        customers: customersDiff
      };
    } catch (error) {
      console.error('Erro ao comparar backups:', error);
      throw error;
    }
  }

  /**
   * Compara dois arrays de objetos
   */
  private compareArrays<T>(arr1: T[], arr2: T[], key: keyof T): {
    added: number;
    removed: number;
    modified: number;
  } {
    const map1 = new Map(arr1.map(item => [item[key], item]));
    const map2 = new Map(arr2.map(item => [item[key], item]));

    let added = 0;
    let removed = 0;
    let modified = 0;

    // Verifica itens adicionados ou modificados
    for (const [key, item2] of map2) {
      if (!map1.has(key)) {
        added++;
      } else if (JSON.stringify(item2) !== JSON.stringify(map1.get(key))) {
        modified++;
      }
    }

    // Verifica itens removidos
    for (const [key] of map1) {
      if (!map2.has(key)) {
        removed++;
      }
    }

    return { added, removed, modified };
  }
}

export const cloudSyncService = new CloudSyncService(); 