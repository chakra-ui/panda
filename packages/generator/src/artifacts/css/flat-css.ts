import type { Dict } from '@pandacss/types'
import type { Context } from '../../engines'
import { generateGlobalCss } from './global-css'
import { generateKeyframeCss } from './keyframe-css'
import { generateResetCss } from './reset-css'
import { generateStaticCss } from './static-css'
import { generateTokenCss } from './token-css'

export const generateFlattenedCss = (ctx: Context) => (options: { files: string[]; resolve?: boolean }) => {
  const { files, resolve } = options
  const { theme: { keyframes } = {}, preflight, minify, staticCss } = ctx.config

  const layersStr = '@layer reset, base, tokens, recipes, utilities;'

  const unresolved = [
    Object.keys(ctx.layers).reduce((acc, name) => acc.replace(name, (ctx.layers as Dict<string>)[name]), layersStr),
    preflight && "@import './reset.css';",
    "@import './global.css';",
    staticCss && "@import './static.css';",
    !ctx.tokens.isEmpty && "@import './tokens/index.css';",
    keyframes && "@import './tokens/keyframes.css';",
  ]
    .filter(Boolean)
    .join('\n\n')

  const sheet = ctx.createSheet({
    content: resolve
      ? [
          generateGlobalCss(ctx),
          staticCss && generateStaticCss(ctx),
          preflight && generateResetCss(ctx),
          !ctx.tokens.isEmpty && generateTokenCss(ctx),
          keyframes && generateKeyframeCss(ctx),
        ]
          .filter(Boolean)
          .join('\n\n')
      : unresolved,
  })

  sheet.append(...files)

  return sheet.toCss({ optimize: true, minify })
}
