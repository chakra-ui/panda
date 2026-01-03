import type { Context } from '@pandacss/core'
import type { TextStyleSpec } from '@pandacss/types'
import { generateCompositionStyleSpec } from '../shared'

export const generateTextStylesSpec = (ctx: Context): TextStyleSpec => {
  return generateCompositionStyleSpec('text-styles', ctx.config.theme, ctx.config.jsxStyleProps) as TextStyleSpec
}
