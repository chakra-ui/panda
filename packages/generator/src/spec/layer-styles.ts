import type { Context } from '@pandacss/core'
import type { LayerStyleSpec } from '@pandacss/types'
import { generateCompositionStyleSpec } from '../shared'

export const generateLayerStylesSpec = (ctx: Context): LayerStyleSpec => {
  return generateCompositionStyleSpec('layer-styles', ctx.config.theme, ctx.config.jsxStyleProps) as LayerStyleSpec
}
