import { isObject } from '@pandacss/shared'
import type { Context } from '../../engines'
import { generateGlobalCss } from './global-css'
import { generateKeyframeCss } from './keyframe-css'
import { generateResetCss } from './reset-css'
import { generateStaticCss } from './static-css'
import { generateTokenCss } from './token-css'

export interface FlattenedCssOptions {
  collect?: boolean
  resolve?: boolean
}

/**
 * Generates the final CSS, including all the artifacts and styles found in app code
 */
export const generateFlattenedCss = (ctx: Context) => (options?: FlattenedCssOptions) => {
  const { collect = true, resolve } = options ?? {}
  const { theme: { keyframes } = {}, preflight, minify, staticCss } = ctx.config

  const sheet = ctx.createSheet()
  if (resolve) {
    generateGlobalCss(ctx, sheet)
    preflight && generateResetCss(ctx, isObject(preflight) ? preflight.scope : '', sheet)
    !ctx.tokens.isEmpty && generateTokenCss(ctx, sheet)
    keyframes && generateKeyframeCss(ctx, sheet)
    staticCss && generateStaticCss(ctx, sheet)
  } else {
    const unresolved = [
      ctx.layers.rule,
      preflight && "@import './reset.css';",
      "@import './global.css';",
      staticCss && "@import './static.css';",
      !ctx.tokens.isEmpty && "@import './tokens/index.css';",
      keyframes && "@import './tokens/keyframes.css';",
    ]
      .filter(Boolean)
      .join('\n\n')

    sheet.setContent(unresolved)
  }

  if (collect) {
    const collector = ctx.styleCollector.collect(ctx.hashFactory)
    sheet.processStyleCollector(collector)
  }

  const output = sheet.toCss({ optimize: true, minify })

  void ctx.hooks.callHook('generator:css', 'styles.css', output)

  return output
}
