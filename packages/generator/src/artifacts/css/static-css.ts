import { getStaticCss } from '@pandacss/core'
import type { Context } from '../../engines'

export const generateStaticCss = (ctx: Context) => {
  const { config, utility, recipes } = ctx
  const { staticCss = {}, theme = {}, optimize = true } = config

  const sheet = ctx.createSheet()
  const fn = getStaticCss(staticCss)

  const results = fn({
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
    sheet.processAtomic(css)
  })

  results.recipes.forEach((result) => {
    Object.entries(result).forEach(([name, value]) => {
      const recipeConfig = recipes.getConfig(name)
      if (!recipeConfig) return
      sheet.processRecipe(name, recipeConfig, value)
    })
  })

  const output = sheet.toCss({ optimize })

  void ctx.hooks.callHook('generator:css', 'static.css', output)

  return output
}
