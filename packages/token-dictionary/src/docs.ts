import type { Token } from './token'

export function getTokenDocs(tokens: Token[]) {
  const group: Record<string, Record<string, Token[]>> = {}

  tokens.forEach((token) => {
    const { path } = token
    const { category } = token.extensions

    if (token.extensions.isVirtual || token.extensions.category !== 'colors' || !category) return

    const newPath = path.slice(1, -1)
    const newPathStr = newPath.join('.') || 'uncategorized'

    group[category] ||= {}

    group[category][newPathStr] ||= []
    group[category][newPathStr].push(token)
  })

  return group
}
