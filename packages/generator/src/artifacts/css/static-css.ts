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

  const getPropertyKeys = (prop: string) => {
    const propConfig = utility.config[prop]
    if (!propConfig) return []

    const values = utility.getPropertyValues(propConfig)
    if (!values) return []

    return Object.keys(values)
  }

  const results = getResult({
    breakpoints: Object.keys(theme.breakpoints ?? {}),
    getPropertyKeys,
    getRecipeKeys: (recipe) => {
      return recipes.details.find((detail) => detail.baseName === recipe)?.variantKeyMap ?? {}
    },
    getPatternPropValues: (patternName, property) => {
      const patternConfig = ctx.patterns.getConfig(patternName)
      if (!patternConfig) return []

      const propType = patternConfig.properties?.[property]
      if (!propType) return

      if (propType.type === 'enum') {
        return propType.value
      }

      if (propType.type === 'boolean') {
        return ['true', 'false']
      }

      if (propType.type === 'property') {
        return getPropertyKeys(property)
      }

      if (propType.type === 'token') {
        const values = ctx.tokens.getValue(propType.value)
        return Object.keys(values ?? {})
      }
    },
    getPatternKeys: (patternName) => {
      const details = ctx.patterns.details.find((d) => d.baseName === patternName)
      if (!details) return

      return details.props ?? []
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

  results.patterns.forEach((result) => {
    Object.entries(result).forEach(([name, value]) => {
      ctx.stylesheet.processAtomic({ [name]: value })
    })
  })

  void ctx.hooks.callHook('generator:css', 'static.css', '')
}
