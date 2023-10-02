import type { StaticCssOptions } from '@pandacss/types'

interface StaticContext {
  breakpoints: string[]
  getPropertyKeys: (property: string) => string[]
  getRecipeKeys: (recipe: string) => {
    [variant: string]: string[]
  }
}

const formatCondition = (ctx: StaticContext, value: string) => (ctx.breakpoints.includes(value) ? value : `_${value}`)

export function getStaticCss(options: StaticCssOptions) {
  const { css = [], recipes = {} } = options

  const results: { css: Record<string, any>[]; recipes: Record<string, any>[] } = { css: [], recipes: [] }

  return (ctx: StaticContext) => {
    css.forEach((rule) => {
      const conditions = rule.conditions || []
      if (rule.responsive) {
        conditions.push(...ctx.breakpoints)
      }

      Object.entries(rule.properties).forEach(([property, values]) => {
        const computedValues = values.flatMap((value) => (value === '*' ? ctx.getPropertyKeys(property) : value))

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
      rules.forEach((rule) => {
        const { __base, ...recipeKeys } = ctx.getRecipeKeys(recipe)
        const useAllKeys = rule === '*'
        const { conditions = [], responsive = useAllKeys, ...variants } = useAllKeys ? recipeKeys : rule

        if (responsive) {
          conditions.push(...ctx.breakpoints)
        }

        if (__base) {
          const conditionalValues = conditions.reduce(
            (acc, condition) => ({
              base: __base,
              ...acc,
              [formatCondition(ctx, condition)]: __base,
            }),
            {},
          )

          results.recipes.push({
            [recipe]: conditions.length ? conditionalValues : __base,
          })
        }

        Object.entries(variants).forEach(([variant, values]) => {
          if (!Array.isArray(values)) return

          const computedValues = values.flatMap((value) => {
            if (value === '*') {
              return recipeKeys[variant]
            }

            return value
          })

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
              [recipe]: {
                [variant]: conditions.length ? conditionalValues : value,
              },
            })
          })
        })
      })
    })

    return results
  }
}
