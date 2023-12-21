import type { CssRule, StaticCssOptions } from '@pandacss/types'

export interface StaticContext {
  breakpoints: string[]
  getPropertyKeys: (property: string) => string[]
  getRecipeKeys: (recipe: string) => {
    [variant: string]: string[]
  }
  getPatternPropValues: (patternName: string, propery: string) => string[] | undefined
  getPatternKeys: (patternName: string) => string[] | undefined
}

interface StaticCssResults {
  css: Record<string, any>[]
  recipes: Record<string, any>[]
  patterns: Record<string, any>[]
}

const formatCondition = (ctx: StaticContext, value: string) => (ctx.breakpoints.includes(value) ? value : `_${value}`)

export function getStaticCss(options: StaticCssOptions) {
  const { css = [], recipes = {}, patterns = {} } = options

  const results: StaticCssResults = { css: [], recipes: [], patterns: [] }

  return (ctx: StaticContext) => {
    css.forEach((rule) => {
      const conditions = rule.conditions || []
      if (rule.responsive) {
        conditions.push(...ctx.breakpoints)
      }

      Object.entries(rule.properties).forEach(([property, values]) => {
        const propKeys = ctx.getPropertyKeys(property)
        const computedValues = values.flatMap((value) => (value === '*' ? propKeys : value))

        computedValues.forEach((value) => {
          const conditionalValues = conditions.reduce(
            (acc, condition) => ({
              base: value,
              ...acc,
              [formatCondition(ctx, condition)]: value,
            }),
            {},
          )

          results.css.push({
            [property]: conditions.length ? conditionalValues : value,
          })
        })
      })
    })

    Object.entries(recipes).forEach(([recipe, rules]) => {
      results.recipes.push({
        [recipe]: {
          [recipe]: '__ignore__',
        },
      })

      rules.forEach((rule) => {
        const recipeKeys = ctx.getRecipeKeys(recipe)
        if (!recipeKeys) return

        const useAllKeys = rule === '*'
        const { conditions = [], responsive, ...variants } = useAllKeys ? recipeKeys : rule

        if (responsive) {
          conditions.push(...ctx.breakpoints)
        }

        Object.entries(variants).forEach(([variant, values]) => {
          if (!Array.isArray(values)) return

          const computedValues = values.flatMap((value) => (value === '*' ? recipeKeys[variant] : value))

          computedValues.forEach((value) => {
            const conditionalValues = conditions.reduce(
              (acc, condition) => ({
                base: value,
                ...acc,
                [formatCondition(ctx, condition)]: value,
              }),
              {},
            )

            results.recipes.push({
              [recipe]: { [variant]: conditions.length ? conditionalValues : value },
            })
          })
        })
      })
    })

    Object.entries(patterns).forEach(([pattern, rules]) => {
      rules.forEach((rule) => {
        const patternProps = ctx.getPatternKeys(pattern)
        if (!patternProps) return

        let props = {} as CssRule['properties']
        const useAllKeys = rule === '*'
        if (useAllKeys) {
          props = Object.fromEntries(patternProps.map((key) => [key, ['*']]))
        }

        const { conditions = [], responsive = false, properties = props } = useAllKeys ? {} : rule
        if (responsive) {
          conditions.push(...ctx.breakpoints)
        }

        Object.entries(properties).forEach(([property, values]) => {
          const patternKeys = ctx.getPatternPropValues(pattern, property)
          const computedValues = values.flatMap((value) => (value === '*' ? patternKeys : value))

          computedValues.forEach((value) => {
            const conditionalValues = conditions.reduce(
              (acc, condition) => ({
                base: value,
                ...acc,
                [formatCondition(ctx, condition)]: value,
              }),
              {},
            )

            results.patterns.push({
              [pattern]: { [property]: conditions.length ? conditionalValues : value },
            })
          })
        })
      })
    })

    return results
  }
}
