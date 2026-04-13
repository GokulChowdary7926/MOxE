/** @type {import('ts-jest').JestConfigWithTsJest} */
const base = require('./jest.config.js');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/src/__tests__/e2e/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverage: false,
  verbose: true,
  /** Each suite imports `app` from `server.ts` (large graph). Parallel workers duplicate heap → OOM locally/CI. */
  maxWorkers: 1,
};
