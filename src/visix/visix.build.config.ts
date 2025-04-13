import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'es2020',
  platform: 'browser',
  external: ['react', 'react-dom', 'recharts'],
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    };
  },
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
});
