import type { Context } from '@pandacss/core'
import { capitalize, walkObject } from '@pandacss/shared'
import type { Token } from '@pandacss/token-dictionary'
import type { ThemesSpec, ThemeSpecDefinition, ThemeTokenGroupDefinition, ThemeTokenValue } from '@pandacss/types'
import { generateTokenExamples } from './token-examples'

const generateThemeTokenGroups = (
  ctx: Context,
  themeName: string,
  filterFn: (token: Token) => boolean,
): ThemeTokenGroupDefinition[] => {
  const jsxStyleProps = ctx.config.jsxStyleProps
  const condName = '_theme' + capitalize(themeName)

  // Use allTokens instead of categoryMap to avoid deduplication issues
  // when multiple themes define the same token path
  const themeTokens = ctx.tokens.allTokens.filter(
    (token) => token.extensions.isVirtual && token.extensions.theme === themeName && filterFn(token),
  )

  // Group by category
  const byCategory = new Map<string, Token[]>()
  for (const token of themeTokens) {
    const category = token.extensions.category
    if (!category) continue
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category)!.push(token)
  }

  return Array.from(byCategory.entries())
    .map(([category, typeTokens]) => {
      if (!typeTokens.length) return null

      const firstToken = typeTokens[0]
      const { functionExamples, tokenFunctionExamples, jsxExamples } = generateTokenExamples(firstToken, jsxStyleProps)

      const values: ThemeTokenValue[] = typeTokens.map((token) => {
        const conditions: Array<{ value: string; condition?: string }> = []

        walkObject(token.extensions.rawValue, (value, path) => {
          conditions.push({
            value,
            condition: path.map((p) => (p === condName ? themeName : p.replace(/^_/, ''))).join('.'),
          })
        })

        return {
          name: token.extensions.prop || token.name,
          values: conditions,
          description: token.description,
          deprecated: token.deprecated,
          cssVar: token.extensions.varRef,
        }
      })

      return {
        type: category,
        values,
        tokenFunctionExamples,
        functionExamples,
        jsxExamples,
      }
    })
    .filter(Boolean) as ThemeTokenGroupDefinition[]
}

export const generateThemesSpec = (ctx: Context): ThemesSpec | undefined => {
  const themes = ctx.config.themes
  if (!themes || Object.keys(themes).length === 0) return undefined

  const data: ThemeSpecDefinition[] = Object.keys(themes).map((themeName) => {
    const tokens = generateThemeTokenGroups(ctx, themeName, (token) => !token.extensions.isSemantic)
    const semanticTokens = generateThemeTokenGroups(ctx, themeName, (token) => token.extensions.isSemantic)

    return { name: themeName, tokens, semanticTokens }
  })

  return {
    type: 'themes',
    data,
  }
}
