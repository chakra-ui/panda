import type { Context } from './engines'
import { getStaticCss as _getStaticCss } from '@pandacss/core'

export const getStaticCss = (ctx: Context) => {
  const { config, createSheet, utility, recipes } = ctx
  const { staticCss = {}, theme = {} } = config

  const sheet = createSheet()
  const fn = _getStaticCss(staticCss)

  const results = fn({
    breakpoints: Object.keys(theme.breakpoints ?? {}),
    getPropertyKeys: utility.getPropertyKeys,
    getRecipeKeys: (recipe) => recipes.details[recipe],
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

  return sheet.toCss()
}
