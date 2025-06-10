import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'apps/web/app/lib/**/*.test.ts',
      'apps/web/app/lib/**/*.test.tsx',
      'apps/web/app/api/**/*.test.ts',
      'apps/web/app/api/**/*.test.tsx',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});