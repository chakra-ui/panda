import { filterBaseConditions, isImportant, walkObject, walkStyles, withoutImportant } from '@css-panda/shared'
import type { RecipeConfig } from '@css-panda/types'
import merge from 'lodash.merge'
import { AtomicRule, ProcessOptions } from './atomic-rule'
import { ConditionalRule } from './conditional-rule'
import { cssToJs, toCss } from './to-css'
import type { GeneratorContext } from './types'

type StyleObject = Record<string, any>

export class Recipe {
  constructor(private config: RecipeConfig, private context: GeneratorContext) {}

  walk = (styleObject: StyleObject) => {
    const { utility, conditions } = this.context
    const rule = new ConditionalRule(conditions)

    const transformed: StyleObject = {}

    walkStyles(styleObject, (styles, scopes) => {
      // recipe can only have one scope (for now)
      const [selector] = scopes || []

      const result: StyleObject = {}

      walkObject(styles, (value, paths) => {
        const important = isImportant(value)

        const [prop, ...allConditions] = conditions.shift(paths)

        // remove default condition
        const _conditions = filterBaseConditions(allConditions)

        let { styles } = utility.resolve(prop, withoutImportant(value))

        const hasConditions = _conditions.length > 0

        if (hasConditions) {
          const cssRoot = toCss(styles, { important })
          rule.nodes = cssRoot.root.nodes
          rule.selector = `&`
          rule.update()

          rule.applyConditions(_conditions)

          styles = cssToJs(rule.toString())
        }

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

  transform = (prop: string, value: string) => {
    const { name, base = {}, variants = {} } = this.config

    if (value === '__ignore__') {
      return {
        className: name,
        styles: base,
      }
    }

    return {
      className: `${name}__${prop}-${value}`,
      styles: variants[prop]?.[value] ?? {},
    }
  }

  expand = () => {
    const { name, base = {}, variants = {}, defaultVariants = {} } = this.config

    const recipe: Required<RecipeConfig> = {
      name,
      base: {},
      variants: {},
      defaultVariants,
    }

    recipe.base = this.walk(base)

    for (const [key, variant] of Object.entries(variants)) {
      for (const [value, styles] of Object.entries(variant)) {
        merge(recipe.variants, { [key]: { [value]: this.walk(styles) } })
      }
    }

    return recipe
  }

  process = (options: ProcessOptions) => {
    const { styles } = options

    const { name, defaultVariants = {} } = this.config
    const ctx = { ...this.context, transform: this.transform }
    const rule = new AtomicRule(ctx)

    return rule.process({
      styles: {
        [name]: '__ignore__',
        ...defaultVariants,
        ...styles,
      },
    })
  }

  toCss = () => {
    return this.context.root.toString()
  }
}

export function mergeRecipes(recipes: RecipeConfig[] | undefined = [], ctx: GeneratorContext) {
  return Object.fromEntries(
    recipes.map((config) => {
      const recipe = new Recipe(config, ctx)
      return [config.name, recipe.expand()]
    }),
  )
}
