import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import _import from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  { ignores: ['dist', 'node_modules'] },
  {
    extends: fixupConfigRules(
      compat.extends(
        'prettier',
        'plugin:prettier/recommended',
        'plugin:react-hooks/recommended',
        'plugin:import/errors',
        'plugin:import/warnings'
      )
    ),

    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      prettier: fixupPluginRules(prettier),
      'react-hooks': fixupPluginRules(reactHooks),
      import: fixupPluginRules(_import),
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals['shared-node-browser'],
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },

        rules: {
          curly: ['warn', 'multi-line', 'consistent'],
          'no-console': 'off',
          'no-empty-pattern': 'warn',
          'no-duplicate-imports': 'error',

          'import/no-unresolved': [
            'error',
            {
              commonjs: true,
              amd: true,
            },
          ],

          'import/export': 'error',
          'import/named': 'off',
          'import/namespace': 'off',
          'import/default': 'off',
          '@typescript-eslint/explicit-module-boundary-types': 'off',

          'no-unused-vars': [
            'warn',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
            },
          ],

          '@typescript-eslint/no-unused-vars': [
            'warn',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
            },
          ],

          '@typescript-eslint/no-use-before-define': 'off',
          '@typescript-eslint/no-empty-function': 'off',
          '@typescript-eslint/no-empty-interface': 'off',
          '@typescript-eslint/no-explicit-any': 'off',
        },
      },
    },

    settings: {
      react: {
        version: 'detect',
      },

      'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],

      'import/parsers': {
        '@typescript-eslint/parser': ['.js', '.jsx', '.ts', '.tsx'],
      },

      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          paths: ['src'],
        },

        alias: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          map: [['@react-three/postprocessing', './src/index.tsx']],
        },
      },
    },
  },
  {
    files: ['**/src'],

    languageOptions: {
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
])
