import type { Context } from '@pandacss/core'
import type { Stylesheet } from '@pandacss/core'

export const generateStaticCss = (ctx: Context, sheet?: Stylesheet) => {
  const { config, staticCss } = ctx
  const engine = staticCss.process(ctx.config.staticCss ?? {}, sheet)

  if (!sheet) {
    const { optimize = true, minify } = config
    let output = engine.sheet.toCss({ optimize, minify })

    if (ctx.hooks['cssgen:done']) {
      output = ctx.hooks['cssgen:done']?.({ artifact: 'static', content: output }) ?? output
    }

    return output
  }
}
