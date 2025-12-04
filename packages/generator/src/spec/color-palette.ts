import type { Context } from '@pandacss/core'
import type { ColorPaletteSpec } from '@pandacss/types'

export const generateColorPaletteSpec = (ctx: Context): ColorPaletteSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const values = Array.from(ctx.tokens.view.colorPalettes.keys()).sort()

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
