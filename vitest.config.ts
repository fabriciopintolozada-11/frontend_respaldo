import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': import.meta.dirname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'unit-tests/**/*.{test,spec}.{ts,tsx}'],
    projects: [
      {
        test: {
          name: 'src',
          environment: 'jsdom',
          globals: true,
          css: false,
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'unit-tests',
          environment: 'jsdom',
          globals: true,
          css: false,
          include: ['unit-tests/**/*.{test,spec}.{ts,tsx}'],
          setupFiles: ['unit-tests/auth/setup.ts'],
        },
      },
    ],
  },
});
