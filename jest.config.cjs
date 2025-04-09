module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    // Gestione delle importazioni di file statici/risorse
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/out/'],
  testTimeout: 30000, // 30 secondi come timeout
  setupFilesAfterEnv: ['./jest.setup.cjs'],
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/services/mcp/**/*.ts",
    "!**/node_modules/**",
    "!**/test-script.ts"
  ],
}; 