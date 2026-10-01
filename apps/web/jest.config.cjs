const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
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
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.test.ts'],
  passWithNoTests: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/**',
  ],
};

module.exports = createJestConfig(config);
