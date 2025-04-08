/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	root: path.resolve(__dirname, 'src'),
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/setupTests.ts"],
		coverage: {
			provider: "v8",
			reportOnFailure: true,
		},
	},
	build: {
		outDir: path.resolve(__dirname, 'dist'),
		emptyOutDir: true,
		sourcemap: true
	},
	server: {
		port: 3000
	},
	define: {
		"process.env": {
			NODE_ENV: JSON.stringify(process.env.IS_DEV ? "development" : "production"),
			IS_DEV: JSON.stringify(process.env.IS_DEV),
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, './src')
		}
	}
});
