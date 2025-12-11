import type { Context } from '@pandacss/core'
import type { AnimationStyleSpec } from '@pandacss/types'
import { generateCompositionStyleSpec } from '../shared'

export const generateAnimationStylesSpec = (ctx: Context): AnimationStyleSpec => {
  return generateCompositionStyleSpec('animation-styles', ctx.config.theme, ctx.config.jsxStyleProps)
}
