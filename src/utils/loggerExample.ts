import log from './logger';

// Exemplos de uso do logger

export function exemploLogs() {
  // Log de informação
  log.info('Aplicação iniciada com sucesso');
  
  // Log de debug
  log.debug('Dados do usuário carregados:', { userId: 123, name: 'João' });
  
  // Log de aviso
  log.warn('Conexão com servidor lenta');
  
  // Log de erro
  try {
    // Simular um erro
    throw new Error('Erro de conexão');
  } catch (error) {
    log.error('Erro ao conectar com servidor:', error);
  }
  
  // Log com diferentes níveis
  log.debug('Informações de debug');
  log.info('Informação geral');
  log.warn('Aviso importante');
  log.error('Erro crítico');
}

// Função para log de performance
export function logPerformance(operation: string, startTime: number) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration > 1000) {
    log.warn(`Operação ${operation} demorou ${duration}ms`);
  } else {
    log.debug(`Operação ${operation} completada em ${duration}ms`);
  }
}

// Função para log de API
export function logApiCall(endpoint: string, method: string, status: number) {
  if (status >= 400) {
    log.error(`API ${method} ${endpoint} retornou status ${status}`);
  } else {
    log.info(`API ${method} ${endpoint} - Status: ${status}`);
  }
} 