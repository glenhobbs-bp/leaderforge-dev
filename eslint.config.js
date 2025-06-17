import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: [
      'eslint.config.js',
      'vitest.config.ts',
      'postcss.config.js',
      'tailwind.config.ts',
      'next.config.js',
      '.next/',
      'dist/',
      'build/',
      'node_modules/',
      '**/*.d.ts',
    ],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.eslint.json',
      },
      globals: {
        fetch: 'readonly',
        window: 'readonly',
        process: 'readonly',
        console: 'readonly',
        React: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        alert: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];