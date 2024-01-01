import type { Context } from '../../engines'
import type { Stylesheet } from '@pandacss/core'

export const generateStaticCss = (ctx: Context, sheet?: Stylesheet) => {
  const { config, staticCss } = ctx
  const engine = staticCss.process(ctx.config.staticCss ?? {}, sheet)

  if (!sheet) {
    const { optimize = true, minify } = config
    const output = engine.sheet.toCss({ optimize, minify })
    void ctx.hooks.callHook('generator:css', 'static.css', output)
    return output
  }
}
