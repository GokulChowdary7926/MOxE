/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // E2E lives in __tests__/e2e and runs in a separate Jest process (jest.e2e.config.js) so mocks of ../server in service tests never break Supertest.
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/__tests__/e2e/'],
  modulePathIgnorePatterns: ['node_modules', 'dist'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    'src/services/post.service.ts': {
      lines: 30,
      functions: 20,
      branches: 25,
      statements: 25,
    },
    'src/services/message.service.ts': {
      lines: 13,
      functions: 8,
      branches: 4,
      statements: 11,
    },
    'src/services/follow.service.ts': {
      lines: 45,
      functions: 16,
      branches: 14,
      statements: 36,
    },
    'src/services/privacy.service.ts': {
      lines: 46,
      functions: 33,
      branches: 42,
      statements: 41,
    },
    'src/services/job/track.service.ts': {
      lines: 13,
      functions: 12,
      branches: 8,
      statements: 13,
    },
    // Auth logic currently lives in phone verification + auth routes (no dedicated auth.service.ts yet).
    'src/services/phoneVerification.service.ts': {
      lines: 63,
      functions: 80,
      branches: 30,
      statements: 57,
    },
  },
  verbose: true,
  testTimeout: 60_000,
  maxWorkers: process.env.CI ? 2 : '50%',
};
