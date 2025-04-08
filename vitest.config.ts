import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/vitest.setup.ts'],
    mockReset: true,
  },
  resolve: {
    alias: {
      'vscode': path.resolve(__dirname, 'src/__mocks__/vscode.ts'),
      'vscode-webview': path.resolve(__dirname, 'src/__mocks__/vscode-webview.ts')
    }
  }
}); 