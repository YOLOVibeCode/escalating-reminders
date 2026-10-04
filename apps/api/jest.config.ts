export {};

const baseConfig = require('../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: '@er/api',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@er/constants$': '<rootDir>/../../packages/@er/constants/src',
    '^@er/interfaces$': '<rootDir>/../../packages/@er/interfaces/src',
    '^@er/types$': '<rootDir>/../../packages/@er/types/src',
    '^@er/utils$': '<rootDir>/../../packages/@er/utils/src',
    '^@noctusoft/store-client$': '<rootDir>/../../packages/store-client/index.js',
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/main.ts',
  ],
};

