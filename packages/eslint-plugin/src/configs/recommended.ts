export default {
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@pandacss'],
  rules: {
    '@pandacss/file-not-included': 'error',
    '@pandacss/no-config-function-in-source': 'error',
    '@pandacss/no-debug': 'warn',
    '@pandacss/no-dynamic-styling': 'warn',
    '@pandacss/no-invalid-token-paths': 'error',
  },
}
