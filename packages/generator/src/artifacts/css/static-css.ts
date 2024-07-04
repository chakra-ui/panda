import type { Context } from '@pandacss/core'
import type { Stylesheet } from '@pandacss/core'

export const generateStaticCss = (ctx: Context, sheet?: Stylesheet) => {
  const { config, staticCss } = ctx
  const engine = staticCss.process(ctx.config.staticCss ?? {}, sheet)

  if (!sheet) {
    const { minify } = config
    let css = engine.sheet.toCss({ minify })

    if (ctx.hooks['cssgen:done']) {
      css = ctx.hooks['cssgen:done']({ artifact: 'static', content: css }) ?? css
    }

    return css
  }
}
