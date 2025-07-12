// Configurações globais para testes
import '@testing-library/jest-dom';

// Mock do AsyncStorage para testes
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock básico do Expo
jest.mock('expo', () => ({
  Linking: { openURL: jest.fn() },
  Print: { printAsync: jest.fn(), printToFileAsync: jest.fn() },
  Sharing: { shareAsync: jest.fn() },
  MailComposer: { composeAsync: jest.fn() },
}));

// Mock básico do React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: { alert: jest.fn() },
    Linking: { openURL: jest.fn() },
  };
});

// Configurações globais
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 