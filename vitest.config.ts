import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        'test/**',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/*.config.{js,ts}',
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
    testTimeout: 10000,
    hookTimeout: 10000,
    deps: {
      external: ['vscode'],
      interopDefault: true,
      inline: [
        '@testing-library/react',
        '@testing-library/jest-dom',
      ],
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