/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
	plugins: [react()],
	root: resolve(__dirname, 'src'),
	test: {
		environment: 'node',
		globals: true,
		setupFiles: ["./src/setupTests.ts"],
		coverage: {
			provider: 'c8',
			reportOnFailure: true,
		},
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			external: ['vscode']
		}
	},
	server: {
		port: 3000
	},
	define: {
		'process.env': {
			NODE_ENV: JSON.stringify(process.env['IS_DEV'] ? "development" : "production"),
			IS_DEV: JSON.stringify(process.env['IS_DEV']),
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, './src'),
			"@shared": resolve(__dirname, '../src/shared'),
			"@webview": resolve(__dirname, './src'),
			"@test": resolve(__dirname, '../test')
		}
	}
});
