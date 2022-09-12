import type { Utility } from './css-utility'
import { logger } from '@css-panda/logger'
import { walkObject, walkStyles } from '@css-panda/shared'
import type { RecipeConfig } from '@css-panda/types'
import merge from 'lodash.merge'

type StyleObject = Record<string, any>

export class Recipe {
  private utility: Utility
  private config: RecipeConfig

  constructor(options: { utility: Utility; config: RecipeConfig }) {
    this.utility = options.utility
    this.config = options.config
  }

  private walk(styleObject: StyleObject) {
    const transformed: StyleObject = {}

    walkStyles(styleObject, (styles, selector) => {
      const result: StyleObject = {}

      walkObject(styles, (value, paths) => {
        if (paths.length > 1) {
          logger.error({
            type: 'recipe',
            msg: `
          Conditional values are not supported in recipes.
          You provided the follow conditions for ${paths[0]}: ${paths.slice(1).join(', ')}
          `,
          })
        }

        const [prop] = paths as string[]
        const { styles } = this.utility.resolve(prop, value)

        if (selector) {
          result[selector] ||= {}
          merge(result[selector], styles)
        } else {
          merge(result, styles)
        }
      })

      merge(transformed, result)
    })

    return transformed
  }

  transform() {
    const { name, base = {}, variants = {}, defaultVariants = {} } = this.config

    const recipe: Required<RecipeConfig> = {
      name,
      base: {},
      variants: {},
      defaultVariants,
    }

    merge(recipe.base, this.walk(base))

    for (const [key, variant] of Object.entries(variants)) {
      for (const [value, styles] of Object.entries(variant)) {
        merge(recipe.variants, { [key]: { [value]: this.walk(styles) } })
      }
    }

    return recipe
  }
}

export function mergeRecipes(recipes: RecipeConfig[] | undefined, utility: Utility) {
  return Object.fromEntries(
    (recipes ?? []).map((config) => {
      const recipe = new Recipe({ utility, config })
      const transformed = recipe.transform()
      return [config.name, transformed]
    }),
  )
}
