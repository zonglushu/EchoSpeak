import { defineConfig } from 'eslint/config';

const sharedIgnores = defineConfig({
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  ignores: [
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.storybook/generated/**',
    '**/node_modules/**',
  ],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
});

export default sharedIgnores;
