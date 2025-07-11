import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  minQuantity: number; // Quantidade mínima para alerta
  maxQuantity: number; // Quantidade máxima para controle
  lastUpdated: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  date: string;
  userId?: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  type: 'baixo' | 'alto' | 'zerado';
  message: string;
  date: string;
  resolved: boolean;
}

class InventoryService {
  private inventoryKey = 'smartpdv_inventory';
  private movementsKey = 'smartpdv_inventory_movements';
  private alertsKey = 'smartpdv_stock_alerts';

  async init(): Promise<void> {
    try {
      const inventory = await AsyncStorage.getItem(this.inventoryKey);
      if (!inventory) {
        await AsyncStorage.setItem(this.inventoryKey, JSON.stringify([]));
      }

      const movements = await AsyncStorage.getItem(this.movementsKey);
      if (!movements) {
        await AsyncStorage.setItem(this.movementsKey, JSON.stringify([]));
      }

      const alerts = await AsyncStorage.getItem(this.alertsKey);
      if (!alerts) {
        await AsyncStorage.setItem(this.alertsKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Erro ao inicializar serviço de estoque:', error);
    }
  }

  async getAllInventory(): Promise<InventoryItem[]> {
    try {
      const inventory = await AsyncStorage.getItem(this.inventoryKey);
      return inventory ? JSON.parse(inventory) : [];
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      return [];
    }
  }

  async getInventoryItem(productId: string): Promise<InventoryItem | null> {
    try {
      const inventory = await this.getAllInventory();
      return inventory.find(item => item.productId === productId) || null;
    } catch (error) {
      console.error('Erro ao buscar item do estoque:', error);
      return null;
    }
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    try {
      const inventory = await this.getAllInventory();
      const newItem: InventoryItem = {
        ...item,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString(),
      };

      inventory.push(newItem);
      await AsyncStorage.setItem(this.inventoryKey, JSON.stringify(inventory));
      return newItem;
    } catch (error) {
      console.error('Erro ao adicionar item ao estoque:', error);
      throw error;
    }
  }

  async updateInventoryQuantity(productId: string, newQuantity: number, reason: string, type: 'entrada' | 'saida' | 'ajuste' = 'ajuste'): Promise<boolean> {
    try {
      const inventory = await this.getAllInventory();
      const index = inventory.findIndex(item => item.productId === productId);
      
      if (index === -1) return false;

      const previousQuantity = inventory[index].quantity;
      inventory[index].quantity = newQuantity;
      inventory[index].lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(this.inventoryKey, JSON.stringify(inventory));

      // Registrar movimentação
      await this.addMovement({
        productId,
        type,
        quantity: Math.abs(newQuantity - previousQuantity),
        previousQuantity,
        newQuantity,
        reason,
        date: new Date().toISOString(),
      });

      // Verificar alertas
      await this.checkStockAlerts(productId, newQuantity);

      return true;
    } catch (error) {
      console.error('Erro ao atualizar quantidade do estoque:', error);
      return false;
    }
  }

  async addMovement(movement: Omit<InventoryMovement, 'id'>): Promise<InventoryMovement> {
    try {
      const movements = await this.getAllMovements();
      const newMovement: InventoryMovement = {
        ...movement,
        id: Date.now().toString(),
      };

      movements.push(newMovement);
      await AsyncStorage.setItem(this.movementsKey, JSON.stringify(movements));
      return newMovement;
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error);
      throw error;
    }
  }

  async getAllMovements(): Promise<InventoryMovement[]> {
    try {
      const movements = await AsyncStorage.getItem(this.movementsKey);
      return movements ? JSON.parse(movements) : [];
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      return [];
    }
  }

  async getProductMovements(productId: string): Promise<InventoryMovement[]> {
    try {
      const movements = await this.getAllMovements();
      return movements.filter(movement => movement.productId === productId);
    } catch (error) {
      console.error('Erro ao buscar movimentações do produto:', error);
      return [];
    }
  }

  async checkStockAlerts(productId: string, currentQuantity: number): Promise<void> {
    try {
      const inventoryItem = await this.getInventoryItem(productId);
      if (!inventoryItem) return;

      const alerts = await this.getAllAlerts();
      let shouldCreateAlert = false;
      let alertType: 'baixo' | 'alto' | 'zerado' = 'baixo';
      let message = '';

      if (currentQuantity === 0) {
        alertType = 'zerado';
        message = `Produto ${productId} está com estoque zerado!`;
        shouldCreateAlert = true;
      } else if (currentQuantity <= inventoryItem.minQuantity) {
        alertType = 'baixo';
        message = `Produto ${productId} está com estoque baixo (${currentQuantity}/${inventoryItem.minQuantity})`;
        shouldCreateAlert = true;
      } else if (currentQuantity >= inventoryItem.maxQuantity) {
        alertType = 'alto';
        message = `Produto ${productId} está com estoque alto (${currentQuantity}/${inventoryItem.maxQuantity})`;
        shouldCreateAlert = true;
      }

      if (shouldCreateAlert) {
        const newAlert: StockAlert = {
          id: Date.now().toString(),
          productId,
          type: alertType,
          message,
          date: new Date().toISOString(),
          resolved: false,
        };

        alerts.push(newAlert);
        await AsyncStorage.setItem(this.alertsKey, JSON.stringify(alerts));
      }
    } catch (error) {
      console.error('Erro ao verificar alertas de estoque:', error);
    }
  }

  async getAllAlerts(): Promise<StockAlert[]> {
    try {
      const alerts = await AsyncStorage.getItem(this.alertsKey);
      return alerts ? JSON.parse(alerts) : [];
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }
  }

  async getActiveAlerts(): Promise<StockAlert[]> {
    try {
      const alerts = await this.getAllAlerts();
      return alerts.filter(alert => !alert.resolved);
    } catch (error) {
      console.error('Erro ao buscar alertas ativos:', error);
      return [];
    }
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alerts = await this.getAllAlerts();
      const index = alerts.findIndex(alert => alert.id === alertId);
      
      if (index === -1) return false;

      alerts[index].resolved = true;
      await AsyncStorage.setItem(this.alertsKey, JSON.stringify(alerts));
      return true;
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      return false;
    }
  }

  async getLowStockProducts(): Promise<InventoryItem[]> {
    try {
      const inventory = await this.getAllInventory();
      return inventory.filter(item => item.quantity <= item.minQuantity);
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      return [];
    }
  }

  async getOutOfStockProducts(): Promise<InventoryItem[]> {
    try {
      const inventory = await this.getAllInventory();
      return inventory.filter(item => item.quantity === 0);
    } catch (error) {
      console.error('Erro ao buscar produtos sem estoque:', error);
      return [];
    }
  }

  async getInventoryReport(startDate?: string, endDate?: string): Promise<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    movements: InventoryMovement[];
  }> {
    try {
      const inventory = await this.getAllInventory();
      const movements = await this.getAllMovements();
      
      const lowStock = inventory.filter(item => item.quantity <= item.minQuantity).length;
      const outOfStock = inventory.filter(item => item.quantity === 0).length;

      let filteredMovements = movements;
      if (startDate && endDate) {
        filteredMovements = movements.filter(movement => 
          movement.date >= startDate && movement.date <= endDate
        );
      }

      return {
        totalProducts: inventory.length,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * 0), 0), // TODO: Adicionar preço do produto
        movements: filteredMovements,
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de estoque:', error);
      return {
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0,
        movements: [],
      };
    }
  }
}

export const inventoryService = new InventoryService(); 