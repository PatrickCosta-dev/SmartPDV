module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
<<<<<<< HEAD
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
=======
  roots: ['<rootDir>/__tests__/pure'],
  testMatch: [
    '**/__tests__/pure/**/*.test.ts',
    '**/__tests__/pure/**/*.test.tsx'
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}'
  ],
  coverageDirectory: 'coverage/pure',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.pure.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
<<<<<<< HEAD
  },
  passWithNoTests: true,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|qrcode)'
  ],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-print$': '<rootDir>/__tests__/mocks/expo-print.mock.js',
    '^expo-sharing$': '<rootDir>/__tests__/mocks/expo-sharing.mock.js',
    '^qrcode$': '<rootDir>/__tests__/mocks/qrcode.mock.js'
=======
>>>>>>> 3be8b7dcf4464b53d4ea99e564c468fe98b8f220
  }
}; 