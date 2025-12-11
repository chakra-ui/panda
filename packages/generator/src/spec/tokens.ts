import type { Context } from '@pandacss/core'
import { walkObject } from '@pandacss/shared'
import type { Token } from '@pandacss/token-dictionary'
import type {
  SemanticTokenSpec,
  SemanticTokenGroupDefinition,
  SemanticTokenValue,
  TokenSpec,
  TokenGroupDefinition,
  TokenValue,
} from '@pandacss/types'
import { generateJsxExample, type JsxStyleProps } from '../shared'

const CATEGORY_PROPERTY_MAP: Record<string, string> = {
  colors: 'color',
  spacing: 'padding',
  sizes: 'width',
  fonts: 'fontFamily',
  fontSizes: 'fontSize',
  fontWeights: 'fontWeight',
  letterSpacings: 'letterSpacing',
  lineHeights: 'lineHeight',
  shadows: 'boxShadow',
  radii: 'borderRadius',
  durations: 'transitionDuration',
  easings: 'transitionTimingFunction',
  gradients: 'backgroundImage',
  aspectRatios: 'aspectRatio',
  cursor: 'cursor',
  borderWidths: 'borderWidth',
  borders: 'border',
  zIndex: 'zIndex',
  opacity: 'opacity',
  blurs: 'filter',
}

const getCategoryProperty = (category?: string): string => {
  return category ? CATEGORY_PROPERTY_MAP[category] ?? 'color' : 'color'
}

const generateTokenExamples = (token: Token, jsxStyleProps: JsxStyleProps = 'all') => {
  const prop = getCategoryProperty(token.extensions?.category)

  const tokenName = token.extensions.prop
  const fullTokenName = token.name

  const functionExamples: string[] = [`css({ ${prop}: '${tokenName}' })`]
  const tokenFunctionExamples: string[] = [`token('${fullTokenName}')`]
  const jsxExamples: string[] = []

  const jsxExample = generateJsxExample({ [prop]: tokenName }, jsxStyleProps)
  if (jsxExample) {
    jsxExamples.push(jsxExample)
  }

  if (token.extensions.varRef) {
    tokenFunctionExamples.push(`token.var('${fullTokenName}')`)
  }

  return { functionExamples, tokenFunctionExamples, jsxExamples }
}

export const generateTokensSpec = (ctx: Context): TokenSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps

  // Create grouped data structure using tokens.view.categoryMap
  const groupedData: TokenGroupDefinition[] = Array.from(ctx.tokens.view.categoryMap.entries())
    .map(([category, tokenMap]) => {
      // Convert Map values to array and filter
      const typeTokens = Array.from(tokenMap.values()).filter(
        (token) =>
          !token.extensions.isSemantic &&
          !token.extensions.isVirtual &&
          !token.extensions.conditions &&
          !token.extensions.isNegative,
      )

      // Skip if no tokens after filtering
      if (!typeTokens.length) return null

      // Get examples from first token of this type (they'll be the same for all)
      const firstToken = typeTokens[0]
      const { functionExamples, tokenFunctionExamples, jsxExamples } = generateTokenExamples(firstToken, jsxStyleProps)

      const values: TokenValue[] = typeTokens.map((token) => ({
        name: token.extensions.prop || token.name,
        value: token.value,
        description: token.description,
        deprecated: token.deprecated,
        cssVar: token.extensions.varRef,
      }))

      return {
        type: category,
        values,
        tokenFunctionExamples,
        functionExamples,
        jsxExamples,
      }
    })
    .filter(Boolean) as TokenGroupDefinition[]

  return {
    type: 'tokens',
    data: groupedData,
  }
}

export const generateSemanticTokensSpec = (ctx: Context): SemanticTokenSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps

  // Create grouped data structure using tokens.view.categoryMap
  const groupedData: SemanticTokenGroupDefinition[] = Array.from(ctx.tokens.view.categoryMap.entries())
    .map(([category, tokenMap]) => {
      // Convert Map values to array and filter for semantic tokens
      const typeTokens = Array.from(tokenMap.values()).filter(
        (token) => (token.extensions.isSemantic || token.extensions.conditions) && !token.extensions.isVirtual,
      )

      // Skip if no tokens after filtering
      if (!typeTokens.length) return null

      // Get examples from first token of this type
      const firstToken = typeTokens[0]
      const { functionExamples, tokenFunctionExamples, jsxExamples } = generateTokenExamples(firstToken, jsxStyleProps)

      const values: SemanticTokenValue[] = typeTokens.map((token) => {
        const conditions: Array<{ value: string; condition?: string }> = []

        walkObject(token.extensions.rawValue, (value, path) => {
          conditions.push({ value, condition: path.map((p) => p.replace(/^_/, '')).join('.') })
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
    .filter(Boolean) as SemanticTokenGroupDefinition[]

  return {
    type: 'semantic-tokens',
    data: groupedData,
  }
}
