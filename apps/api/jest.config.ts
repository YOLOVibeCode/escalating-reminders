export {};

const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: '@er/api',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@er/constants$': '<rootDir>/../../packages/@er/constants/src',
    '^@er/interfaces$': '<rootDir>/../../packages/@er/interfaces/src',
    '^@er/types$': '<rootDir>/../../packages/@er/types/src',
    '^@er/utils$': '<rootDir>/../../packages/@er/utils/src',
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/main.ts',
  ],
};

