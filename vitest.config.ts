import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: [
      'scripts/codemods/__tests__/**/*.test.ts',
      'src/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts'
    ],
    exclude: [
      'src/__tests__/problematic/**/*.test.ts'
    ],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**',
        'src/**/*.d.ts',
        'src/index.ts',
        'node_modules/**',
        'scripts/codemods/__tests__/**'
      ],
      all: true,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    setupFiles: ['src/test/setup-vitest.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    deps: {
      external: ['vscode'],
      interopDefault: true
    }
  },
  resolve: {
    alias: {
      'vscode': path.resolve(__dirname, 'src/test/__mocks__/vscode.ts'),
      '@': path.resolve(__dirname, './src'),
    },
    conditions: ['node']
  },
}); 