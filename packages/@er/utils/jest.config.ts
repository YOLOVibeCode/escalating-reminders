import type { Config } from 'jest';
import baseConfig from '../../../jest.config.base';

const config: Config = {
  ...baseConfig,
  displayName: '@er/utils',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@er/types$': '<rootDir>/../../@er/types/src',
    '^@er/constants$': '<rootDir>/../../@er/constants/src',
  },
};

export default config;

