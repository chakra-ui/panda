import type { Token } from '@pandacss/token-dictionary'
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

export const getCategoryProperty = (category?: string): string => {
  return category ? CATEGORY_PROPERTY_MAP[category] ?? 'color' : 'color'
}

export const generateTokenExamples = (token: Token, jsxStyleProps: JsxStyleProps = 'all') => {
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
