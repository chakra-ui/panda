import type { Context, Stylesheet } from '@pandacss/core'

export const generateGlobalCss = (ctx: Context, sheet: Stylesheet) => {
  const { globalCss = {} } = ctx.config

  sheet.processGlobalCss({
    ':root': { '--made-with-panda': `'🐼'` },
  })

  sheet.processGlobalCss(globalCss)
}
