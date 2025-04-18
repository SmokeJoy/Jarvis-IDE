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
    environment: 'node',
    setupFiles: ['./setup.ts'],
    coverage: {
      provider: 'c8',
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
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
      ]
    },
    alias: {
      '@shared': resolve(__dirname, '../src/shared'),
      '@webview': resolve(__dirname, 'src'),
      '@test': resolve(__dirname, 'tests')
    }
  },
}); 