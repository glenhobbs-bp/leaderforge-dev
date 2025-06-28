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
      'apps/web/components/**/*.test.ts',
      'apps/web/components/**/*.test.tsx',
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
    ],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'apps/web/components/widgets/**/*',
        'packages/agent-core/**/*'
      ],
      exclude: [
        'node_modules',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.*',
        '**/types.ts'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  },
});