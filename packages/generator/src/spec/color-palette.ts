import type { Context } from '@pandacss/core'
import type { ColorPaletteSpec } from '@pandacss/types'
import { formatProps, generateJsxExample } from '../shared'

const getColorPaletteExampleValues = (ctx: Context, paletteValues: string[]) => {
  const examplePalette = paletteValues[0]
  const availableTokens = ctx.tokens.view.getColorPaletteValues(examplePalette)

  if (availableTokens.length === 0) {
    return { examplePalette, bgToken: null, colorToken: null }
  }

  if (availableTokens.length === 1) {
    return { examplePalette, bgToken: availableTokens[0], colorToken: null }
  }

  // Pick first and second for examples
  const bgToken = availableTokens[0]
  const colorToken = availableTokens[1]

  return { examplePalette, bgToken, colorToken }
}

export const generateColorPaletteSpec = (ctx: Context): ColorPaletteSpec | null => {
  // Don't emit color-palette spec if colorPalette is disabled
  const colorPaletteConfig = ctx.config.theme?.colorPalette
  if (colorPaletteConfig?.enabled === false) {
    return null
  }

  const jsxStyleProps = ctx.config.jsxStyleProps
  const values = Array.from(ctx.tokens.view.colorPalettes.keys()).sort()

  // If there are no color palettes, don't emit the spec
  if (!values.length) {
    return null
  }

  // Get example values
  const { examplePalette, bgToken, colorToken } = getColorPaletteExampleValues(ctx, values)

  const functionExamples: string[] = []
  const jsxExamples: string[] = []

  // Basic example with just colorPalette
  const basicProps = { colorPalette: examplePalette }
  functionExamples.push(`css({ ${formatProps(basicProps)} })`)

  const basicJsx = generateJsxExample(basicProps, jsxStyleProps)
  if (basicJsx) {
    jsxExamples.push(basicJsx)
  }

  // Extended example with bg and color tokens
  if (bgToken || colorToken) {
    const extendedProps = { colorPalette: examplePalette, bg: bgToken, color: colorToken }
    functionExamples.push(`css({ ${formatProps(extendedProps)} })`)

    const extendedJsx = generateJsxExample(extendedProps, jsxStyleProps)
    if (extendedJsx) {
      jsxExamples.push(extendedJsx)
    }
  }

  return {
    type: 'color-palette',
    data: {
      values,
      functionExamples,
      jsxExamples,
    },
  }
}
