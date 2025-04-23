import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      'test/**',
      'scripts/codemods/__tests__/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/[.]**',
        'packages/*/test?(s)/**',
        '**/*.d.ts',
        '**/virtual:*',
        '**/__mocks__/*',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/test/setup.[jt]s',
        '**/.{eslint,mocha,prettier}rc.{?(c|m)[jt]s,yml}'
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
        '@testing-library/jest-dom'
      ]
    },
    alias: {
      '@shared': '/src/shared',
      '@webview': '/webview-ui/src',
      '@test': resolve(__dirname, './test'),
      'vscode': resolve(__dirname, 'src/test/__mocks__/vscode.ts'),
      '@': resolve(__dirname, './src')
    }
  },
  resolve: {
    alias: {
      '@shared': '/src/shared',
      '@webview': '/webview-ui/src'
    }
  }
}); 