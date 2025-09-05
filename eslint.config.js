// Configuración de ESLint para el proyecto
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  prettier,

  // Carpetas a ignorar durante el linting
  {
    ignores: ['**/.astro/**', 'dist', 'node_modules'],
  },

  // Reglas relajadas para archivos de declaración de tipos
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
