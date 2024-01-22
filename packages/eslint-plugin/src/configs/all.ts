import { rules } from '../rules'
import { RULE_NAME as FileNotIncluded } from '../rules/file-not-included'
import { RULE_NAME as NoConfigunctionInSource } from '../rules/no-config-function-in-source'
import { RULE_NAME as NoInvalidTokenPaths } from '../rules/no-invalid-token-paths'

const errorRules = [FileNotIncluded, NoConfigunctionInSource, NoInvalidTokenPaths]

const allRules = Object.fromEntries(
  Object.entries(rules).map(([name]) => {
    return [`@pandacss/${name}`, errorRules.includes(name) ? 'error' : 'warn']
  }),
)

export default {
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: ['@pandacss'],
  rules: allRules,
}
