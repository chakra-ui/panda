import { CSSUtility } from '@css-panda/css-utility'
import { Recipe } from '@css-panda/types'
import { walkObject } from '@css-panda/walk-object'
import merge from 'lodash.merge'
import { createDebugger } from '@css-panda/logger'

const debug = createDebugger('recipe')

type StyleObject = Record<string, any>

export class CSSRecipe {
  private utility: CSSUtility
  private config: Recipe

  constructor(options: { utility: CSSUtility; config: Recipe }) {
    this.utility = options.utility
    this.config = options.config
  }

  private walk(obj: StyleObject) {
    const transformed: StyleObject = {}

    forEach(obj, (styles, selector) => {
      const result: StyleObject = {}

      walkObject(styles, (value, paths) => {
        console.log(paths)
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

    const recipe: Required<Recipe> = {
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

function forEach(obj: Record<string, any>, fn: (style: Record<string, any>, scope?: string) => void) {
  const { selectors = {}, '@media': mediaQueries = {}, ...styles } = obj

  fn(styles)

  for (const [scope, _styles] of Object.entries(selectors)) {
    fn(_styles as any, scope)
  }

  for (const [scope, _styles] of Object.entries(mediaQueries)) {
    fn(_styles as any, `@media ${scope}`)
  }
}

export function mergeRecipes(recipes: Recipe[] | undefined, utility: CSSUtility) {
  return Object.fromEntries(
    (recipes ?? []).map((config) => {
      //
      const recipe = new CSSRecipe({ utility, config })
      const transformed = recipe.transform()

      debug(config.name, transformed)

      return [config.name, transformed]
    }),
  )
}
