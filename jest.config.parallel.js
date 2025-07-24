const baseConfig = require('./jest.config');

// Optimized Jest configuration for parallel execution
module.exports = {
  ...baseConfig,
  
  // Enable parallel test execution
  maxWorkers: '50%', // Use 50% of available CPU cores
  
  // Test sharding for CI environments
  ...(process.env.CI && {
    maxWorkers: 4,
    testTimeout: 30000,
  }),
  
  // Optimize test discovery
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.parallel.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.parallel.{spec,test}.{js,jsx,ts,tsx}'
  ],
  
  // Cache configuration for faster runs
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Fail fast in CI to save time
  bail: process.env.CI ? 1 : 0,
  
  // Reporter configuration for better output
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit-parallel.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],
  
  // Coverage optimizations
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  coverageReporters: ['json-summary', 'lcov'],
  
  // Module resolution optimizations
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    // Add any specific mappings for parallel tests
  },
  
  // Transform optimizations
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
        isolatedModules: true, // Faster transpilation
      },
    ],
  },
  
  // Global setup/teardown for parallel tests
  globalSetup: '<rootDir>/src/test-utils/parallel-setup.ts',
  globalTeardown: '<rootDir>/src/test-utils/parallel-teardown.ts',
};