import type { StaticCssOptions } from '@pandacss/types'

type StaticContext = {
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
        const computedValues = typeof values === 'boolean' ? ctx.getPropertyKeys(property) : values

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
        const { conditions: _conditions, responsive, ...variants } = rule
        const conditions = _conditions || []
        if (responsive) {
          conditions.push(...ctx.breakpoints)
        }

        Object.entries(variants).forEach(([variant, values]) => {
          if (!Array.isArray(values)) return

          values.forEach((value) => {
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
