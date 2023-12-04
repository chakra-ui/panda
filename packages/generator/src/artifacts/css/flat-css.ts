import type { Context } from '../../engines'
import { generateGlobalCss } from './global-css'
import { generateKeyframeCss } from './keyframe-css'
import { generateResetCss } from './reset-css'
import { generateStaticCss } from './static-css'
import { generateTokenCss } from './token-css'

export interface FlattenedCssOptions {
  files: string[]
  resolve?: boolean
}

function getUnresolvedCss(ctx: Context) {
  const { theme: { keyframes } = {}, preflight, staticCss } = ctx.config
  return [
    ctx.layerString,
    preflight && "@import './reset.css';",
    "@import './global.css';",
    staticCss && "@import './static.css';",
    !ctx.tokens.isEmpty && "@import './tokens/index.css';",
    keyframes && "@import './tokens/keyframes.css';",
  ]
    .filter(Boolean)
    .join('\n\n')
}

function getResolvedCss(ctx: Context) {
  const { theme: { keyframes } = {}, preflight, staticCss } = ctx.config
  return [
    generateGlobalCss(ctx),
    staticCss && generateStaticCss(ctx),
    preflight && generateResetCss(ctx),
    !ctx.tokens.isEmpty && generateTokenCss(ctx),
    keyframes && generateKeyframeCss(ctx),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export const generateFlattenedCss = (ctx: Context, options: FlattenedCssOptions) => {
  const { files, resolve } = options
  const { minify } = ctx.config

  const content = resolve ? getResolvedCss(ctx) : getUnresolvedCss(ctx)

  const sheet = ctx.createSheet()
  sheet.content = content

  sheet.append(...files)

  const output = sheet.toCss({ optimize: true, minify })

  void ctx.hooks.callHook('generator:css', 'styles.css', output)

  return output
}
