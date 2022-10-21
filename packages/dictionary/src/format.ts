import type { TokenDictionary } from './dictionary'
import type { Token } from './token'

export function groupByCondition(dict: TokenDictionary) {
  const grouped: Map<string, Set<Token>> = new Map()

  dict.allTokens.forEach((token) => {
    const { condition } = token.extensions
    if (!condition) return
    grouped.get(condition) || grouped.set(condition, new Set())
    grouped.set(condition, grouped.get(condition)!.add(token))
  })

  return grouped
}

export function groupByCategory(dict: TokenDictionary) {
  const grouped: Map<string, Set<Token>> = new Map()

  dict.allTokens.forEach((token) => {
    const { category } = token.extensions
    if (!category) return
    grouped.get(category) || grouped.set(category, new Set())
    grouped.set(category, grouped.get(category)!.add(token))
  })

  return grouped
}

export function getFlattenedJson(dict: TokenDictionary) {
  const grouped = groupByCategory(dict)

  const result: Record<string, any> = {}

  grouped.forEach((tokens, category) => {
    result[category] = {}

    tokens.forEach((token) => {
      const { name, value } = token
      result[category][name] = value
    })
  })

  return result
}
