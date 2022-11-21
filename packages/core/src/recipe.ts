import { walkStyles } from '@css-panda/shared'
import type { RecipeConfig } from '@css-panda/types'
import merge from 'lodash.merge'
import { AtomicRule, ProcessOptions } from './atomic-rule'
import { serializeStyle } from './serialize'
import type { StylesheetContext } from './types'

type StyleObject = Record<string, any>

export class Recipe {
  config: RecipeConfig
  constructor(config: RecipeConfig, private context: StylesheetContext) {
    const { name, base = {}, variants = {}, defaultVariants = {}, description = '' } = config

    const recipe: Required<RecipeConfig> = {
      name,
      description,
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

    this.config = recipe
  }

  walk = (styleObject: StyleObject) => {
    const { utility, conditions } = this.context

    const transformed: StyleObject = {}

    walkStyles(styleObject, (styles, scopes) => {
      // recipe can only have one scope (for now)
      const [selector] = scopes || []

      const result: StyleObject = {}

      const currentStyles = serializeStyle(styles, { utility, conditions })

      if (selector) {
        result[selector] ||= {}
        merge(result[selector], currentStyles)
      } else {
        merge(result, currentStyles)
      }

      merge(transformed, result)
    })

    return transformed
  }

  transform = (prop: string, value: string) => {
    const { separator } = this.context.utility
    const { name, base = {}, variants = {} } = this.config

    if (value === '__ignore__') {
      return {
        className: name,
        styles: base,
      }
    }

    return {
      className: `${name}--${prop}${separator}${value}`,
      styles: variants[prop]?.[value] ?? {},
    }
  }

  process = (options: ProcessOptions) => {
    const { styles } = options

    const { name, defaultVariants = {} } = this.config
    const ctx = { ...this.context, transform: this.transform }
    const rule = new AtomicRule(ctx)
    rule.layer = 'recipes'

    rule.process({
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
