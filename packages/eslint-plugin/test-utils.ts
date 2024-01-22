import { RuleTester, type RuleTesterConfig } from '@typescript-eslint/rule-tester'

const baseTesterConfig: RuleTesterConfig = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
}

export const tester = new RuleTester(baseTesterConfig)
