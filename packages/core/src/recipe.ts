import { walkStyles } from '@pandacss/shared'
import type { RecipeConfig } from '@pandacss/types'
import merge from 'lodash.merge'
import { AtomicRule, ProcessOptions } from './atomic-rule'
import { serializeStyle } from './serialize'
import type { StylesheetContext } from './types'

type StyleObject = Record<string, any>

export class Recipe {
  config: RecipeConfig
  name: string
  values = new Map<string, Set<{ className: string; value: string }>>()

  constructor(config: RecipeConfig, private context: StylesheetContext) {
    const { name, base = {}, variants = {}, defaultVariants = {}, description = '' } = config

    this.name = name

    const recipe: Required<RecipeConfig> = {
      name,
      description,
      base: {},
      variants: {},
      defaultVariants,
    }

    recipe.base = this.walk(base)

    for (const [key, variant] of Object.entries(variants)) {
      for (const [variantKey, styles] of Object.entries(variant)) {
        this.setValues(key, variantKey)
        merge(recipe.variants, {
          [key]: { [variantKey]: this.walk(styles) },
        })
      }
    }

    this.config = recipe
  }

  private setValues = (key: string, value: string) => {
    this.values.get(key) || this.values.set(key, new Set())
    this.values.get(key)!.add({
      className: this.getClassName(key, value),
      value: value,
    })
  }

  private getClassName = (key: string, value: string) => {
    const { separator } = this.context.utility
    return `${this.name}--${key}${separator}${value}`
  }

  private walk = (styleObject: StyleObject) => {
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

  private transform = (prop: string, value: string) => {
    const { name, base = {}, variants = {} } = this.config

    if (value === '__ignore__') {
      return {
        className: name,
        styles: base,
      }
    }

    return {
      className: this.getClassName(prop, value),
      styles: variants[prop]?.[value] ?? {},
    }
  }

  process = (options: ProcessOptions) => {
    const { styles: variants } = options

    const { name, defaultVariants = {} } = this.config

    const rule = new AtomicRule({
      ...this.context,
      transform: this.transform,
    })

    rule.layer = 'recipes'

    rule.process({
      styles: {
        [name]: '__ignore__',
        ...defaultVariants,
        ...variants,
      },
    })
  }

  toCss = () => {
    return this.context.root.toString()
  }
}
