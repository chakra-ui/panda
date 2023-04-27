import { capitalize, memo } from '@pandacss/shared'
import type { AnyRecipeConfig } from '@pandacss/types'
import merge from 'lodash.merge'
import { AtomicRule, type ProcessOptions } from './atomic-rule'
import { serializeStyle } from './serialize'
import type { StylesheetContext } from './types'

type StyleObject = Record<string, any>

export class Recipe {
  config: AnyRecipeConfig
  rule: AtomicRule
  name: string

  values = new Map<string, Set<{ className: string; value: string }>>()

  constructor(config: AnyRecipeConfig, private context: StylesheetContext) {
    const {
      name,
      jsx = [capitalize(name)],
      base = {},
      variants = {},
      defaultVariants = {},
      description = '',
      compoundVariants = [],
    } = config

    this.name = name

    const recipe: Required<AnyRecipeConfig> = {
      jsx,
      name,
      description,
      base: {},
      variants: {},
      defaultVariants,
      compoundVariants,
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
    this.rule = this.createRule()
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
    return serializeStyle(styleObject, { utility, conditions })
  }

  private transform = (prop: string, value: string) => {
    const { name, base = {}, variants = {} } = this.config

    if (value === '__ignore__') {
      return {
        layer: 'base',
        className: name,
        styles: base,
      }
    }

    return {
      className: this.getClassName(prop, value),
      styles: variants[prop]?.[value] ?? {},
    }
  }

  private createRule = () => {
    const rule = new AtomicRule({
      ...this.context,
      transform: this.transform,
    })

    rule.layer = 'recipes'

    return rule
  }

  process = memo((options: ProcessOptions) => {
    const { styles: variants } = options
    const { name, defaultVariants = {}, base = {} } = this.config

    const styles = Object.assign({ [name]: '__ignore__' }, defaultVariants, variants)
    const keys = Object.keys(styles)
    if (keys.length === 1 && Object.keys(base).length === 0) {
      return
    }

    this.rule.process({ styles })
  })

  toCss = () => {
    return this.context.root.toString()
  }
}
