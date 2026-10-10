import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});