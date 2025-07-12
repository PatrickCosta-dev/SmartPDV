// Setup para testes de funções puras
// Este arquivo é executado antes de cada teste

// Configurar timezone para testes consistentes
process.env.TZ = 'UTC';

// Mock de console para testes mais limpos
global.console = {
  ...console,
  // Desabilitar logs durante testes, exceto erros
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurar expect para testes mais expressivos
expect.extend({
  toBeValidCurrency(value) {
    const pass = typeof value === 'string' && /^R\$\s\d+,\d{2}$/.test(value);
    return {
      pass,
      message: () => `expected ${value} to be a valid currency format (R$ X,XX)`,
    };
  },
  
  toBeValidDate(value) {
    const pass = value instanceof Date && !isNaN(value.getTime());
    return {
      pass,
      message: () => `expected ${value} to be a valid Date`,
    };
  }
}); 