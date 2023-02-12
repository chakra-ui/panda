import { generateGlobalCss } from './global-css'
import { generateKeyframeCss } from './keyframe-css'
import { generateLayoutGridCss } from './layout-grid-css'
import { generateResetCss } from './reset-css'
import { generateStaticCss } from './static-css'
import { generateTokenCss } from './token-css'
import type { Context } from '../../engines'

export const generateFlattenedCss = (ctx: Context) => (options: { files: string[]; resolve?: boolean }) => {
  const { files, resolve } = options
  const { theme: { keyframes } = {}, preflight, minify, staticCss } = ctx.config

  const unresolved = [
    '@layer reset, base, tokens, recipes, utilities;',
    "@import './layout-grid.css';",
    "@import './global.css';",
    staticCss && "@import './static.css';",
    preflight && "@import './reset.css';",
    !ctx.tokens.isEmpty && "@import './tokens/index.css';",
    keyframes && "@import './tokens/keyframes.css';",
  ]
    .filter(Boolean)
    .join('\n\n')

  const resolved = [
    generateLayoutGridCss(),
    generateGlobalCss(ctx),
    generateStaticCss(ctx),
    generateResetCss(),
    generateTokenCss(ctx),
    generateKeyframeCss(ctx),
  ]
    .filter(Boolean)
    .join('\n\n')

  const sheet = ctx.createSheet({
    content: resolve ? resolved : unresolved,
  })

  sheet.append(...files)

  return sheet.toCss({ minify })
}
