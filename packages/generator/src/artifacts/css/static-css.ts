import { getStaticCss } from '@pandacss/core'
import type { Context } from '../../engines'

export const generateStaticCss = (ctx: Context) => {
  const { config, utility, recipes } = ctx
  const { staticCss = {}, theme = {} } = config

  staticCss.recipes = staticCss.recipes ?? {}

  const recipeConfigs = Object.assign({}, theme.recipes ?? {}, theme.slotRecipes ?? {})

  Object.entries(recipeConfigs).forEach(([name, recipe]) => {
    if (recipe.staticCss) {
      staticCss.recipes![name] = recipe.staticCss
    }
  })

  const getResult = getStaticCss(staticCss)

  const results = getResult({
    breakpoints: Object.keys(theme.breakpoints ?? {}),
    getPropertyKeys: (prop: string) => {
      const propConfig = utility.config[prop]
      if (!propConfig) return []

      const values = utility.getPropertyValues(propConfig)
      if (!values) return []

      return Object.keys(values)
    },
    getRecipeKeys: (recipe) => {
      const recipeConfig = recipes.details.find((detail) => detail.baseName === recipe)
      return Object.assign({ __base: recipeConfig?.config.base }, recipeConfig?.variantKeyMap ?? {})
    },
  })

  results.css.forEach((css) => {
    ctx.stylesheet.processAtomic(css)
  })

  results.recipes.forEach((result) => {
    Object.entries(result).forEach(([name, value]) => {
      const recipeConfig = recipes.getConfig(name)
      if (!recipeConfig) return
      ctx.stylesheet.processRecipe(name, recipeConfig, value)
    })
  })

  void ctx.hooks.callHook('generator:css', 'static.css', '')
}
