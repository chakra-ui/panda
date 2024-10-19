module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['plugin:@pandacss/recommended'],
  ignorePatterns: ['styled-system', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {}
}
