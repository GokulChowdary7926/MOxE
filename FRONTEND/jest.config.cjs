/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  modulePathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'utils/readApiError.ts',
    'hooks/useAdFeed.ts',
    'store/authSlice.ts',
    'store/settingsSlice.ts',
  ],
  coverageThreshold: {
    'utils/readApiError.ts': {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    'hooks/useAdFeed.ts': {
      lines: 65,
      functions: 80,
      branches: 60,
      statements: 70,
    },
    'store/authSlice.ts': {
      lines: 45,
      functions: 40,
      branches: 9,
      statements: 40,
    },
    'store/settingsSlice.ts': {
      lines: 69,
      functions: 35,
      branches: 70,
      statements: 68,
    },
  },
};
