import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@webview/(.*)$': '<rootDir>/webview-ui/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'webview-ui/src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!webview-ui/src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  coverageReporters: ['text', 'json', 'html'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.bonifica.json'
    }
  }
}

export default config; 
 