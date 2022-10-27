import { getDotPath } from '@css-panda/shared'
import type { TokenDictionary } from './dictionary'
import type { Token } from './token'
import { mapToJson } from './utils'

export const formats = {
  groupByCondition(dictionary: TokenDictionary) {
    const grouped: Map<string, Set<Token>> = new Map()
    dictionary.allTokens.forEach((token) => {
      const { condition } = token.extensions
      if (!condition) return
      grouped.get(condition) || grouped.set(condition, new Set())
      grouped.set(condition, grouped.get(condition)!.add(token))
    })
    return grouped
  },

  groupByPalette(dictionary: TokenDictionary) {
    const grouped: Map<string, Map<string, string>> = new Map()

    dictionary.allTokens.forEach((token) => {
      const { palette } = token.extensions
      if (!palette || token.extensions.isVirtual) return
      grouped.get(palette) || grouped.set(palette, new Map())

      const virtualName = token.name.replace(palette, 'palette')
      const virtualToken = dictionary.getByName(virtualName)
      if (!virtualToken) return

      const virtualVar = virtualToken.extensions.var
      grouped.get(palette)!.set(virtualVar, token.extensions.varRef)
    })

    return grouped
  },

  groupByCategory(dictionary: TokenDictionary) {
    const grouped: Map<string, Map<string, Token>> = new Map()
    dictionary.allTokens.forEach((token) => {
      const { category } = token.extensions
      if (!category) return
      grouped.get(category) || grouped.set(category, new Map())
      grouped.set(category, grouped.get(category)!.set(token.extensions.prop, token))
    })
    return grouped
  },

  getFlattenedValues(dictionary: TokenDictionary) {
    const grouped = formats.groupByCategory(dictionary)
    const result: Map<string, Map<string, string>> = new Map()
    grouped.forEach((tokens, category) => {
      result.get(category) || result.set(category, new Map())
      tokens.forEach((token) => {
        const { prop, varRef } = token.extensions
        result.set(category, result.get(category)!.set(prop, varRef))
      })
    })
    return result
  },

  getVars(dictionary: TokenDictionary) {
    const grouped = formats.groupByCondition(dictionary)
    const result: Map<string, Map<string, string>> = new Map()
    grouped.forEach((tokens, condition) => {
      result.get(condition) || result.set(condition, new Map())
      tokens.forEach((token) => {
        result.get(condition)!.set(token.extensions.var, token.value)
      })
    })
    return result
  },

  createVarGetter(dictionary: TokenDictionary) {
    const flatValues = mapToJson(formats.getFlattenedValues(dictionary))
    return function getToken(path: string, fallback?: string | number) {
      return getDotPath(flatValues, path, fallback)
    }
  },

  getPaletteValues(dictionary: TokenDictionary) {
    const values = new Set<string>()
    dictionary.allTokens.forEach((token) => {
      const { palette } = token.extensions
      if (!palette || token.extensions.isVirtual) return
      values.add(palette)
    })
    return values
  },
}
