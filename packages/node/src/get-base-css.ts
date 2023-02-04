import type { PandaContext } from './context'
import { generateTokenCss, generateKeyframes } from './generators/token-css'
import { generateResetCss } from './generators/reset'
import { generateLayoutGridCss } from './generators/layout-grid'

export function getBaseCss(ctx: PandaContext) {
  const css = [
    generateResetCss(),
    generateLayoutGridCss(),
    generateTokenCss(ctx),
    generateKeyframes(ctx.theme.keyframes),
    ctx.getGlobalCss(),
    ctx.getStaticCss(),
  ]
  return css.filter(Boolean).join('\n\n')
}
