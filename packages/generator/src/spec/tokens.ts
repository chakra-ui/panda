import type { Context } from '@pandacss/core'
import { walkObject } from '@pandacss/shared'
import type { Token } from '@pandacss/token-dictionary'
import type { SemanticTokenSpec, SemanticTokenSpecDefinition, TokenSpec, TokenSpecDefinition } from '@pandacss/types'

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

const generateTokenExamples = (token: Token, jsxStyleProps: 'all' | 'minimal' | 'none' = 'all') => {
  const prop = getCategoryProperty(token.extensions?.category)

  const tokenName = token.extensions.prop
  const fullTokenName = token.name

  const functionExamples: string[] = [`css({ ${prop}: '${tokenName}' })`]
  const tokenFunctionExamples: string[] = [`token('${fullTokenName}')`]
  const jsxExamples: string[] = []

  if (jsxStyleProps === 'all') {
    jsxExamples.push(`<Box ${prop}="${tokenName}" />`)
  } else if (jsxStyleProps === 'minimal') {
    jsxExamples.push(`<Box css={{ ${prop}: '${tokenName}' }} />`)
  }
  // 'none' - no JSX examples

  if (token.extensions.varRef) {
    tokenFunctionExamples.push(`token.var('${fullTokenName}')`)
  }

  return { functionExamples, tokenFunctionExamples, jsxExamples }
}

export const generateTokensSpec = (ctx: Context): TokenSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const tokens = ctx.tokens.allTokens
    .filter(
      (token) =>
        !token.extensions.isSemantic &&
        !token.extensions.isVirtual &&
        !token.extensions.conditions &&
        !token.extensions.isNegative,
    )
    .map((token): TokenSpecDefinition => {
      const { functionExamples, tokenFunctionExamples, jsxExamples } = generateTokenExamples(token, jsxStyleProps)
      return {
        name: token.name,
        value: token.value,
        type: token.extensions.category,
        description: token.description,
        deprecated: token.deprecated,
        cssVar: token.extensions.varRef,
        tokenFunctionExamples,
        functionExamples,
        jsxExamples,
      }
    })

  return {
    type: 'tokens',
    data: tokens,
  }
}

export const generateSemanticTokensSpec = (ctx: Context): SemanticTokenSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const semanticTokens = ctx.tokens.allTokens
    .filter((token) => (token.extensions.isSemantic || token.extensions.conditions) && !token.extensions.isVirtual)
    .map((token): SemanticTokenSpecDefinition => {
      const { functionExamples, tokenFunctionExamples, jsxExamples } = generateTokenExamples(token, jsxStyleProps)
      const values: Array<{ value: string; condition?: string }> = []

      walkObject(token.extensions.rawValue, (value, path) => {
        values.push({ value, condition: path.map((p) => p.replace(/^_/, '')).join('.') })
      })

      return {
        name: token.name,
        values,
        type: token.extensions.category,
        description: token.description,
        deprecated: token.deprecated,
        cssVar: token.extensions.varRef,
        tokenFunctionExamples,
        functionExamples,
        jsxExamples,
      }
    })

  return {
    type: 'semantic-tokens',
    data: semanticTokens,
  }
}
