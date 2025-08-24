import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.d.ts',
        'src/generated/**',
        'src/index.ts', // Extension entry point
      ],
    },
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './config'),
    },
  },
})
