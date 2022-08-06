import { calc } from '@css-panda/calc'
import { createVar } from '@css-panda/css-var'

export function getTokenData(category: string, entry: Entry, options: Options = {}): TokenData {
  const { negative, prefix } = options

  const [key, value] = entry

  const variable = createVar(key, {
    prefix: [prefix, category].filter(Boolean).join('-'),
  })

  return {
    negative: !!negative,
    key: negative ? `-${key}` : key,
    keyRef: negative ? `-$${key}` : `$${key}`,
    category,
    value: negative ? calc.negate(value) : value,
    prop: negative ? `${category}.-${key}` : `${category}.${key}`,
    var: variable.var,
    varRef: negative ? calc.negate(variable.ref) : variable.ref,
  }
}

type Options = {
  negative?: boolean
  prefix?: string
}

type Entry = [key: string, value: string]

export type TokenData = {
  /**
   * Whether the token represents a negative value
   */
  negative: boolean
  /**
   * The name of the token (e.g green.500)
   */
  key: string
  /**
   * The reference name of the token (e.g '$green.500')
   */
  keyRef: string
  /**
   * The category or group of the token (e.g 'colors')
   */
  category: string
  /**
   * The value of the token (e.g '#00ff00').
   * If the token is a semantic token, value will be the variable ref
   */
  value: string
  /**
   * The string composed of the category and token name (e.g 'colors.green.500')
   */
  prop: string
  /**
   * The variable name of the token (e.g '--colors-green-500')
   */
  var: `--${string}`
  /**
   * The variable reference of the token (e.g 'var(--colors-green-500)')
   */
  varRef: string
}
