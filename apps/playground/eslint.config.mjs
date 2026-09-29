import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
  // Global ignores (migrated from .eslintignore)
  {
    ignores: ['src/dts/**', '.next/**', 'styled-system/**', 'node_modules/**', 'next-env.d.ts', 'scripts/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // Disable incompatible Next.js rules for ESLint 9
  {
    rules: {
      '@next/next/no-duplicate-head': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      // Ignore unused variables that start with "_"
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  }
]

export default eslintConfig
