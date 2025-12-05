import type { Context } from '@pandacss/core'
import type { ColorPaletteSpec } from '@pandacss/types'

export const generateColorPaletteSpec = (ctx: Context): ColorPaletteSpec | null => {
  // Don't emit color-palette spec if colorPalette is disabled
  const colorPaletteConfig = ctx.config.theme?.colorPalette
  if (colorPaletteConfig?.enabled === false) {
    return null
  }

  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const values = Array.from(ctx.tokens.view.colorPalettes.keys()).sort()

  // If there are no color palettes, don't emit the spec
  if (!values.length) {
    return null
  }

  const functionExamples: string[] = [
    `css({ colorPalette: 'blue' })`,
    `css({ colorPalette: 'blue', bg: 'colorPalette.500', color: 'colorPalette.50' })`,
  ]
  const jsxExamples: string[] = []

  if (jsxStyleProps === 'all') {
    jsxExamples.push(`<Box colorPalette="blue" />`)
    jsxExamples.push(`<Box colorPalette="blue" bg="colorPalette.500" color="colorPalette.50" />`)
  } else if (jsxStyleProps === 'minimal') {
    jsxExamples.push(`<Box css={{ colorPalette: 'blue' }} />`)
    jsxExamples.push(`<Box css={{ colorPalette: 'blue', bg: 'colorPalette.500', color: 'colorPalette.50' }} />`)
  }
  // 'none' - no JSX examples

  return {
    type: 'color-palette',
    data: {
      values,
      functionExamples,
      jsxExamples,
    },
  }
}
