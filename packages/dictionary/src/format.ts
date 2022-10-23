import { getDotPath } from '@css-panda/shared'
import type { TokenDictionary } from './dictionary'
import type { Token } from './token'
import { mapToJson } from './utils'

export const formats = {
  groupByCondition(dict: TokenDictionary) {
    const grouped: Map<string, Set<Token>> = new Map()
    dict.allTokens.forEach((token) => {
      const { condition } = token.extensions
      if (!condition) return
      grouped.get(condition) || grouped.set(condition, new Set())
      grouped.set(condition, grouped.get(condition)!.add(token))
    })
    return grouped
  },

  groupByCategory(dict: TokenDictionary) {
    const grouped: Map<string, Map<string, Token>> = new Map()
    dict.allTokens.forEach((token) => {
      const { category } = token.extensions
      if (!category) return
      grouped.get(category) || grouped.set(category, new Map())
      grouped.set(category, grouped.get(category)!.set(token.extensions.prop, token))
    })
    return grouped
  },

  getFlattenedValues(dict: TokenDictionary) {
    const grouped = formats.groupByCategory(dict)
    const result: Map<string, Map<string, string>> = new Map()
    grouped.forEach((tokens, category) => {
      result.get(category) || result.set(category, new Map())
      tokens.forEach((token) => {
        const value = token.isConditional ? token.extensions.varRef : token.value
        result.set(category, result.get(category)!.set(token.extensions.prop, value))
      })
    })
    return result
  },

  getVars(dict: TokenDictionary) {
    const grouped = formats.groupByCondition(dict)
    const result: Map<string, Map<string, string>> = new Map()
    grouped.forEach((tokens, condition) => {
      result.get(condition) || result.set(condition, new Map())
      tokens.forEach((token) => {
        result.get(condition)!.set(token.extensions.var, token.value)
      })
    })
    return result
  },

  createVarGetter(dict: TokenDictionary) {
    const flatValues = mapToJson(formats.getFlattenedValues(dict))
    return function getToken(path: string, fallback?: string | number) {
      return getDotPath(flatValues, path, fallback)
    }
  },
}
