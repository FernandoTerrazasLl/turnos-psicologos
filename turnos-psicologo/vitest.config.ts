import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [...configDefaults.exclude, '**/*.spec.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        'vite.config.ts',
        'vitest.config.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.ts',
        'src/__tests__/**'
      ]
    }
  }
});
