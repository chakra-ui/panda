import { getStaticCss } from '@pandacss/core'
import type { Context } from '../../engines'

export const generateStaticCss = (ctx: Context) => {
  const { config, createSheet, utility, recipes } = ctx
  const { staticCss = {}, theme = {}, optimize = true } = config

  const sheet = createSheet()
  const fn = getStaticCss(staticCss)

  const results = fn({
    breakpoints: Object.keys(theme.breakpoints ?? {}),
    getPropertyKeys: (prop: string) =>
      utility.getPropertyKeys(prop).filter((key) => !key.startsWith('type:') && !key.startsWith('CssProperties:')),
    getRecipeKeys: (recipe) => recipes.details.find((detail) => detail.config.name === recipe)?.variantKeyMap ?? {},
  })

  results.css.forEach((css) => {
    sheet.processAtomic(css)
  })

  results.recipes.forEach((result) => {
    Object.entries(result).forEach(([name, value]) => {
      const recipeConfig = recipes.getConfig(name)
      if (!recipeConfig) return
      sheet.processRecipe(recipeConfig, value)
    })
  })

  const output = sheet.toCss({ optimize })
  ctx.hooks.callHook('generator:css', 'static.css', output)
  return output
}
