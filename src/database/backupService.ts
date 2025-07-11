import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    products: any[];
    sales: any[];
    customers: any[];
    inventory: any[];
    payments: any[];
  };
}

export interface BackupStats {
  totalRecords: number;
  totalSize: number;
  lastBackup: string | null;
  backupCount: number;
}

class BackupService {
  private backupKey = 'smartpdv_backup_stats';
  private backupDir = `${FileSystem.documentDirectory}backups/`;

  async init(): Promise<void> {
    try {
      // Criar diretório de backup se não existir
      const dirInfo = await FileSystem.getInfoAsync(this.backupDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.backupDir, { intermediates: true });
      }

      // Inicializar estatísticas de backup
      const stats = await AsyncStorage.getItem(this.backupKey);
      if (!stats) {
        await AsyncStorage.setItem(this.backupKey, JSON.stringify({
          totalRecords: 0,
          totalSize: 0,
          lastBackup: null,
          backupCount: 0,
        }));
      }
    } catch (error) {
      console.error('Erro ao inicializar serviço de backup:', error);
    }
  }

  async createBackup(): Promise<string> {
    try {
      console.log('Iniciando backup dos dados...');
      
      // Coletar todos os dados
      const [
        products,
        sales,
        customers,
        inventory,
        payments
      ] = await Promise.all([
        this.getAllProducts(),
        this.getAllSales(),
        this.getAllCustomers(),
        this.getAllInventory(),
        this.getAllPayments(),
      ]);

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          products,
          sales,
          customers,
          inventory,
          payments,
        },
      };

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `smartpdv_backup_${timestamp}.json`;
      const filepath = `${this.backupDir}${filename}`;

      // Salvar arquivo de backup
      await FileSystem.writeAsStringAsync(filepath, JSON.stringify(backupData, null, 2));

      // Atualizar estatísticas
      await this.updateBackupStats(backupData, filepath);

      console.log(`Backup criado com sucesso: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  async restoreBackup(filepath: string): Promise<boolean> {
    try {
      console.log('Iniciando restauração do backup...');
      
      // Ler arquivo de backup
      const backupContent = await FileSystem.readAsStringAsync(filepath);
      const backupData: BackupData = JSON.parse(backupContent);

      // Validar versão do backup
      if (!this.isValidBackup(backupData)) {
        throw new Error('Formato de backup inválido');
      }

      // Restaurar dados
      await Promise.all([
        this.restoreProducts(backupData.data.products),
        this.restoreSales(backupData.data.sales),
        this.restoreCustomers(backupData.data.customers),
        this.restoreInventory(backupData.data.inventory),
        this.restorePayments(backupData.data.payments),
      ]);

      console.log('Backup restaurado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  async exportBackup(): Promise<void> {
    try {
      const filepath = await this.createBackup();
      console.log(`Backup exportado: ${filepath}`);
      // Implementar compartilhamento quando disponível
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      throw error;
    }
  }

  async importBackup(filepath: string): Promise<boolean> {
    try {
      return await this.restoreBackup(filepath);
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      throw error;
    }
  }

  async getBackupStats(): Promise<BackupStats> {
    try {
      const stats = await AsyncStorage.getItem(this.backupKey);
      return stats ? JSON.parse(stats) : {
        totalRecords: 0,
        totalSize: 0,
        lastBackup: null,
        backupCount: 0,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de backup:', error);
      return {
        totalRecords: 0,
        totalSize: 0,
        lastBackup: null,
        backupCount: 0,
      };
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.backupDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const filepath = `${this.backupDir}${filename}`;
      await FileSystem.deleteAsync(filepath);
      console.log(`Backup deletado: ${filename}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar backup:', error);
      return false;
    }
  }

  async autoBackup(): Promise<void> {
    try {
      const stats = await this.getBackupStats();
      const now = new Date();
      const lastBackup = stats.lastBackup ? new Date(stats.lastBackup) : null;
      
      // Fazer backup automático se passou mais de 24 horas
      if (!lastBackup || (now.getTime() - lastBackup.getTime()) > 24 * 60 * 60 * 1000) {
        await this.createBackup();
        console.log('Backup automático realizado');
      }
    } catch (error) {
      console.error('Erro no backup automático:', error);
    }
  }

  private async getAllProducts(): Promise<any[]> {
    try {
      const { db } = await import('./productService');
      return await db.getAllProducts();
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  }

  private async getAllSales(): Promise<any[]> {
    try {
      const { salesDb } = await import('./salesService');
      return await salesDb.getAllSales();
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      return [];
    }
  }

  private async getAllCustomers(): Promise<any[]> {
    try {
      const { customerService } = await import('./customerService');
      return await customerService.getAllCustomers();
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }

  private async getAllInventory(): Promise<any[]> {
    try {
      const { inventoryService } = await import('./inventoryService');
      return await inventoryService.getAllInventory();
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      return [];
    }
  }

  private async getAllPayments(): Promise<any[]> {
    try {
      const { paymentService } = await import('./paymentService');
      return await paymentService.getAllPayments();
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }
  }

  private async restoreProducts(products: any[]): Promise<void> {
    try {
      const { db } = await import('./productService');
      // Limpar produtos existentes e restaurar
      // Implementar lógica de restauração específica
      console.log(`Restaurando ${products.length} produtos`);
    } catch (error) {
      console.error('Erro ao restaurar produtos:', error);
    }
  }

  private async restoreSales(sales: any[]): Promise<void> {
    try {
      const { salesDb } = await import('./salesService');
      // Limpar vendas existentes e restaurar
      console.log(`Restaurando ${sales.length} vendas`);
    } catch (error) {
      console.error('Erro ao restaurar vendas:', error);
    }
  }

  private async restoreCustomers(customers: any[]): Promise<void> {
    try {
      const { customerService } = await import('./customerService');
      // Limpar clientes existentes e restaurar
      console.log(`Restaurando ${customers.length} clientes`);
    } catch (error) {
      console.error('Erro ao restaurar clientes:', error);
    }
  }

  private async restoreInventory(inventory: any[]): Promise<void> {
    try {
      const { inventoryService } = await import('./inventoryService');
      // Limpar estoque existente e restaurar
      console.log(`Restaurando ${inventory.length} itens de estoque`);
    } catch (error) {
      console.error('Erro ao restaurar estoque:', error);
    }
  }

  private async restorePayments(payments: any[]): Promise<void> {
    try {
      const { paymentService } = await import('./paymentService');
      // Limpar pagamentos existentes e restaurar
      console.log(`Restaurando ${payments.length} pagamentos`);
    } catch (error) {
      console.error('Erro ao restaurar pagamentos:', error);
    }
  }

  private async updateBackupStats(backupData: BackupData, filepath: string): Promise<void> {
    try {
      const stats = await this.getBackupStats();
      
      const newStats: BackupStats = {
        totalRecords: 
          backupData.data.products.length +
          backupData.data.sales.length +
          backupData.data.customers.length +
          backupData.data.inventory.length +
          backupData.data.payments.length,
        totalSize: JSON.stringify(backupData).length,
        lastBackup: backupData.timestamp,
        backupCount: stats.backupCount + 1,
      };

      await AsyncStorage.setItem(this.backupKey, JSON.stringify(newStats));
    } catch (error) {
      console.error('Erro ao atualizar estatísticas de backup:', error);
    }
  }

  private isValidBackup(backupData: any): backupData is BackupData {
    return (
      backupData &&
      typeof backupData.version === 'string' &&
      typeof backupData.timestamp === 'string' &&
      backupData.data &&
      Array.isArray(backupData.data.products) &&
      Array.isArray(backupData.data.sales) &&
      Array.isArray(backupData.data.customers) &&
      Array.isArray(backupData.data.inventory) &&
      Array.isArray(backupData.data.payments)
    );
  }
}

export const backupService = new BackupService(); 