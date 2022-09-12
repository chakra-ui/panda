import type { RecipeConfig } from '@css-panda/types'
import { createRuleset, ProcessOptions } from './ruleset'
import type { GeneratorContext } from './types'

export function createRecipeSet(context: GeneratorContext, recipe: RecipeConfig, options: { hash?: boolean } = {}) {
  function transform(prop: string, value: string) {
    if (value === '__ignore__') {
      return {
        className: recipe.name,
        styles: recipe.base ?? {},
      }
    }

    return {
      className: `${recipe.name}__${prop}-${value}`,
      styles: recipe.variants?.[prop]?.[value] ?? {},
    }
  }

  const ruleset = createRuleset({ ...context, transform }, options)

  return {
    process(options: ProcessOptions) {
      const { styles } = options
      return ruleset.process({
        styles: {
          [recipe.name]: '__ignore__',
          ...recipe.defaultVariants,
          ...styles,
        },
      })
    },
    toCss() {
      return context.root.toString()
    },
  }
}

export type RecipeSet = ReturnType<typeof createRecipeSet>
