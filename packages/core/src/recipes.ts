import { capitalize, dashCase, memo, splitProps } from '@pandacss/shared'
import type { RecipeConfig, Dict, SystemStyleObject } from '@pandacss/types'
import merge from 'lodash.merge'
import { AtomicRule, type ProcessOptions } from './atomic-rule'
import { serializeStyle } from './serialize'
import type { RecipeNode, StylesheetContext } from './types'

type RecipeValues = Record<string, RecipeConfig>

const createRegex = (item: Array<string | RegExp>) => {
  const regex = item.map((item) => (typeof item === 'string' ? item : item.source)).join('|')
  return new RegExp(`^${regex}$`)
}

const sharedState = {
  /**
   * The map of recipe names to their resolved class names
   */
  classNames: new Map<string, string>(),
  /**
   * The map of the property to their resolved styless
   */
  styles: new Map<string, SystemStyleObject>(),
  /**
   * The map of the recipes with their resolved styles
   */
  configs: new Map<string, RecipeNode>(),
}

export class Recipes {
  /**
   * The map of the recipes to their atomic rules
   */
  rules: Map<string, AtomicRule> = new Map()

  constructor(
    private recipes: RecipeValues = {},
    private context?: StylesheetContext,
  ) {
    this.assignRules()
  }

  private getPropKey = (recipe: string, variant: string, value: any) => {
    return `${recipe} (${variant} = ${value})`
  }

  private get separator() {
    return this.context?.utility.separator ?? '_'
  }

  private getClassName = (recipe: string, variant: string, value: string) => {
    return `${recipe}--${variant}${this.separator}${value}`
  }

  save = () => {
    for (const [name, recipe] of Object.entries(this.recipes)) {
      this.assignRecipe(name, this.normalize(recipe))
    }
  }

  private assignRecipe = (name: string, recipe: RecipeConfig) => {
    const variantKeys = Object.keys(recipe.variants ?? {})
    const jsx = recipe.jsx ?? [capitalize(name)]
    const match = createRegex(jsx)

    sharedState.configs.set(name, {
      ...this.getNames(name),
      jsx,
      name,
      variantKeys,
      variantKeyMap: Object.fromEntries(
        Object.entries(recipe.variants ?? {}).map(([key, value]) => {
          return [key, Object.keys(value)]
        }),
      ),
      match,
      config: recipe,
      splitProps: (props) => {
        return splitProps(props, variantKeys) as [Dict, Dict]
      },
    })
  }

  assignRules = () => {
    if (!this.context) return
    for (const name of Object.keys(this.recipes)) {
      this.rules.set(name, this.createRule(name))
    }
  }

  isEmpty = () => {
    return sharedState.configs.size === 0
  }

  getNames = memo((name: string) => {
    return {
      upperName: capitalize(name),
      dashName: dashCase(name),
      jsxName: capitalize(name),
    }
  })

  getRecipe = memo((name: string) => {
    return sharedState.configs.get(name)
  })

  getConfig = memo((name: string): RecipeConfig | undefined => {
    return this.recipes[name]
  })

  find = memo((jsxName: string) => {
    return this.details.find((node) => node.match.test(jsxName))
  })

  filter = memo((jsxName: string) => {
    return this.details.filter((node) => node.match.test(jsxName))
  })

  get details() {
    return Array.from(sharedState.configs.values())
  }

  get nodes() {
    return this.details.map(({ upperName, variantKeys, name, jsx, match }) => ({
      type: 'recipe' as const,
      name: upperName,
      props: variantKeys,
      baseName: name,
      jsx,
      match,
    }))
  }

  splitProps = (name: string, props: Dict) => {
    const recipe = this.find(name)
    if (!recipe) return [{}, props]
    return recipe.splitProps(props)
  }

  normalize = (config: RecipeConfig) => {
    const {
      name,
      jsx = [capitalize(name)],
      base = {},
      variants = {},
      defaultVariants = {},
      description = '',
      compoundVariants = [],
    } = config

    const recipe: Required<RecipeConfig> = {
      jsx,
      name,
      description,
      base: {},
      variants: {},
      defaultVariants,
      compoundVariants,
    }

    recipe.base = this.serialize(base)
    sharedState.styles.set(name, recipe.base)
    sharedState.classNames.set(name, name)

    for (const [key, variant] of Object.entries(variants)) {
      for (const [variantKey, styles] of Object.entries(variant)) {
        const propKey = this.getPropKey(name, key, variantKey)
        const className = this.getClassName(name, key, variantKey)

        const styleObject = this.serialize(styles)

        sharedState.styles.set(propKey, styleObject)
        sharedState.classNames.set(propKey, className)

        merge(recipe.variants, {
          [key]: { [variantKey]: styleObject },
        })
      }
    }

    return recipe
  }

  private serialize = (styleObject: Dict) => {
    if (!this.context) return styleObject
    const { utility, conditions } = this.context
    return serializeStyle(styleObject, { utility, conditions })
  }

  private getTransform = (name: string) => {
    return (variant: string, value: string) => {
      if (value === '__ignore__') {
        return {
          layer: '_base',
          className: sharedState.classNames.get(name)!,
          styles: sharedState.styles.get(name) ?? {},
        }
      }

      const propKey = this.getPropKey(name, variant, value)

      return {
        className: sharedState.classNames.get(propKey)!,
        styles: sharedState.styles.get(propKey) ?? {},
      }
    }
  }

  private createRule = (name: string) => {
    if (!this.context) {
      throw new Error("Can't create a rule without a context")
    }

    const rule = new AtomicRule({
      ...this.context,
      transform: this.getTransform(name),
    })

    rule.layer = 'recipes'
    return rule
  }

  process = (recipeName: string, options: ProcessOptions) => {
    const { styles: variants } = options

    const recipe = this.getRecipe(recipeName)
    if (!recipe) return

    const { name, defaultVariants = {}, base = {} } = recipe.config

    const styles = Object.assign({ [name]: '__ignore__' }, defaultVariants, variants)
    const keys = Object.keys(styles)

    if (keys.length === 1 && Object.keys(base).length === 0) {
      return
    }

    const rule = this.rules.get(name)
    rule?.process({ styles })
  }

  toCss = () => {
    if (!this.context) return ''
    return this.context.root.toString()
  }
}
