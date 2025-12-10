import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@er/types$': '<rootDir>/../../packages/@er/types/src',
    '^@er/constants$': '<rootDir>/../../packages/@er/constants/src',
    '^@er/utils$': '<rootDir>/../../packages/@er/utils/src',
    '^@er/ui-components$': '<rootDir>/../../packages/@er/ui-components/src',
    '^@er/api-client$': '<rootDir>/../../packages/@er/api-client/src',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**', // App Router files
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default createJestConfig(config);

