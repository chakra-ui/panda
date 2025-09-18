import { z } from 'zod'
import { loadPandaContext } from '../load-config'

// Schema definitions

export const listTokensSchema = z.object({
  category: z.string().optional().describe('Filter by token category (colors, spacing, sizes, fonts, etc.)'),
})

export const listSemanticTokensSchema = z.object({
  category: z.string().optional().describe('Filter by token category (colors, spacing, sizes, fonts, etc.)'),
})

// Tool implementations

export async function listTokens(args: z.infer<typeof listTokensSchema>): Promise<string[]> {
  const ctx = await loadPandaContext()
  const { category } = args

  // Get all semantic tokens efficiently using the view's conditionMap
  const semanticTokens = new Set<string>()
  ctx.tokens.view.conditionMap.forEach((tokens, condition) => {
    if (condition !== 'base') {
      // Non-base conditions are semantic tokens
      tokens.forEach((token) => semanticTokens.add(token.name))
    }
  })

  if (!category) {
    // Return all regular token names (exclude semantic tokens)
    return ctx.tokens.allTokens
      .filter((token) => !semanticTokens.has(token.name) && token.extensions?.category !== 'semantic')
      .map((token) => token.name)
  }

  // Use the token dictionary's built-in category filtering
  const categoryTokens = ctx.tokens.view.categoryMap.get(category as any)
  if (!categoryTokens) {
    return []
  }

  // Filter out semantic tokens and return names without category prefix
  return Array.from(categoryTokens.values())
    .filter((token) => !semanticTokens.has(token.name) && token.extensions?.category !== 'semantic')
    .map((token) => token.extensions.prop || token.name.substring(category.length + 1))
}

export async function listSemanticTokens(args: z.infer<typeof listSemanticTokensSchema>): Promise<string[]> {
  const ctx = await loadPandaContext()
  const { category } = args

  // Get all semantic tokens efficiently using the view's conditionMap
  const semanticTokens = new Set<string>()
  ctx.tokens.view.conditionMap.forEach((tokens, condition) => {
    if (condition !== 'base') {
      // Non-base conditions are semantic tokens
      tokens.forEach((token) => semanticTokens.add(token.name))
    }
  })

  // Also include tokens with explicit semantic category
  ctx.tokens.allTokens.forEach((token) => {
    if (token.extensions?.category === 'semantic') {
      semanticTokens.add(token.name)
    }
  })

  if (!category) {
    // Return all semantic token names
    return Array.from(semanticTokens)
  }

  // Use the token dictionary's built-in category filtering
  const categoryTokens = ctx.tokens.view.categoryMap.get(category as any)
  if (!categoryTokens) {
    return []
  }

  // Filter for semantic tokens within the category and return without prefix
  return Array.from(categoryTokens.values())
    .filter((token) => semanticTokens.has(token.name))
    .map((token) => token.extensions.prop || token.name.substring(category.length + 1))
}
