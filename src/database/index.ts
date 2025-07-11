import { backupService } from './backupService';
import { customerService } from './customerService';
import { inventoryService } from './inventoryService';
import { paymentService } from './paymentService';
import { db as productService } from './productService';
import { salesDb as salesService } from './salesService';

export const initDatabase = async () => {
  try {
    await productService.initDatabase();
    await salesService.init();
    await customerService.init();
    await inventoryService.init();
    await paymentService.init();
    await backupService.init();
    console.log('Todos os serviços de banco de dados inicializados com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
};

export {
    backupService, customerService,
    inventoryService,
    paymentService,
    productService,
    salesService
};

