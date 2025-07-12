import { backupService } from './backupService';
import { customerService } from './customerService';
import { inventoryService } from './inventoryService';
import { paymentService } from './paymentService';
import { db as productService } from './productService';
import { salesDb as salesService } from './salesService';

export const initDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Inicializa todos os serviços em paralelo
    await Promise.all([
      productService.initDatabase(),
      salesService.init(),
      customerService.init(),
      inventoryService.init(),
      paymentService.init(),
      backupService.init(),
    ]);
    
    console.log('✅ Todos os serviços de banco de dados inicializados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

export {
    backupService, customerService,
    inventoryService,
    paymentService,
    productService,
    salesService
};

