export {};

const baseConfig = require('../../../jest.config.base');

module.exports = {
  ...baseConfig,
  displayName: '@er/utils',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@er/types$': '<rootDir>/../../@er/types/src',
    '^@er/constants$': '<rootDir>/../../@er/constants/src',
  },
};

