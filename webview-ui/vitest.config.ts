/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Copertura rilevante (Aprile 2025)
// - WebviewBridge.mock.ts: ~70.1%
// - WebviewBridge.ts: >90% (test reali resistenza + comunicazione)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        'src/**/*.test.{ts,tsx}',
        'src/tests/**',
        'src/**/*.d.ts',
        'node_modules/**',
        'src/vite-env.d.ts'
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
    alias: {
      '@shared': resolve(__dirname, '../src/shared'),
      '@webview': resolve(__dirname, 'src'),
      '@test': resolve(__dirname, 'tests')
    },
    globals: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../src/shared')
    }
  }
});