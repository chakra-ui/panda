import type { Context } from '../../engines'

export const generateGlobalCss = (ctx: Context) => {
  const { globalCss = {} } = ctx.config
  const sheet = ctx.createSheet()
  sheet.processGlobalCss({
    ':root': { '--made-with-panda': `'🐼'` },
  })
  sheet.processGlobalCss(globalCss)
  return sheet.toCss()
}
