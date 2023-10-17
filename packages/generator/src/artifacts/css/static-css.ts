import type { Context } from '../../engines'

export const generateStaticCss = (ctx: Context) => {
  const { config, staticCss } = ctx
  const { optimize = true, minify } = config
  if (!config.staticCss) return ''

  const output = staticCss.process(config.staticCss).toCss({ optimize, minify })

  void ctx.hooks.callHook('generator:css', 'static.css', output)

  return output
}
