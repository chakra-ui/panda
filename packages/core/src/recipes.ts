import { capitalize, createRegex, dashCase, getSlotRecipes, memo, splitProps } from '@pandacss/shared'
import type { Dict, RecipeConfig, SlotRecipeConfig, SystemStyleObject } from '@pandacss/types'
import merge from 'lodash.merge'
import { AtomicRule, type ProcessOptions } from './atomic-rule'
import { isSlotRecipe } from './is-slot-recipe'
import { serializeStyle } from './serialize'
import type { RecipeNode, StylesheetContext } from './types'

type RecipeRecord = Record<string, RecipeConfig | SlotRecipeConfig>

const sharedState = {
  /**
   * The map of recipe names to their resolved class names
   */
  classNames: new Map<string, string>(),
  /**
   * The map of the property to their resolved styles
   */
  styles: new Map<string, SystemStyleObject>(),
  /**
   * The map of the recipes with their resolved styles
   */
  configs: new Map<string, RecipeNode>(),
  /**
   * The map of recipe key to slot ids
   */
  slots: new Map<string, string[]>(),
}

export class Recipes {
  /**
   * The map of the recipes to their atomic rules
   */
  rules: Map<string, AtomicRule> = new Map()

  constructor(private recipes: RecipeRecord = {}, private context?: StylesheetContext) {
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
      if (isSlotRecipe(recipe)) {
        // extract recipes for each slot
        const slots = getSlotRecipes(recipe)

        // normalize each recipe
        Object.entries(slots).forEach(([slot, slot_recipe]) => {
          const slotName = this.getSlotKey(name, slot)
          this.normalize(slotName, slot_recipe)
        })

        // save the root recipe
        this.assignRecipe(name, recipe)
        //
      } else {
        this.assignRecipe(name, this.normalize(name, recipe))
      }
    }
  }

  private assignRecipe = (name: string, recipe: RecipeConfig | SlotRecipeConfig) => {
    const variantKeys = Object.keys(recipe.variants ?? {})
    const jsx = recipe.jsx ?? [capitalize(name)]
    const match = createRegex(jsx)

    sharedState.configs.set(name, {
      ...this.getNames(name),
      jsx,
      type: 'recipe' as const,
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
      props: variantKeys,
    })

    if (isSlotRecipe(recipe)) {
      sharedState.slots.set(
        name,
        recipe.slots.map((slot) => this.getSlotKey(name, slot)),
      )
    }
  }

  getSlotKey = (name: string, slot: string) => {
    return `${name}__${slot}`
  }

  assignRules = () => {
    if (!this.context) return

    for (const [name, recipe] of Object.entries(this.recipes)) {
      //
      if (isSlotRecipe(recipe)) {
        //
        recipe.slots.forEach((slot) => {
          const slotName = this.getSlotKey(name, slot)
          this.rules.set(slotName, this.createRule(slotName))
        })
        //
      } else {
        //
        this.rules.set(name, this.createRule(name))
      }
    }
  }

  isEmpty = () => {
    return sharedState.configs.size === 0
  }

  getNames = memo((name: string) => {
    return {
      baseName: name,
      upperName: capitalize(name),
      dashName: dashCase(name),
      jsxName: capitalize(name),
    }
  })

  getRecipe = memo((name: string) => {
    return sharedState.configs.get(name)
  })

  getConfig = memo((name: string) => {
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

  splitProps = (recipeName: string, props: Dict) => {
    const recipe = this.details.find((node) => node.baseName === recipeName)
    if (!recipe) return [{}, props]
    return recipe.splitProps(props)
  }

  normalize = (name: string, config: RecipeConfig) => {
    const {
      className,
      jsx = [capitalize(name)],
      base = {},
      variants = {},
      defaultVariants = {},
      description = '',
      compoundVariants = [],
    } = config

    const recipe: Required<RecipeConfig> = {
      ...config,
      jsx,
      className,
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

    const { defaultVariants = {}, base = {} } = recipe.config

    const styles = Object.assign({ [recipeName]: '__ignore__' }, defaultVariants, variants)
    const keys = Object.keys(styles)

    if (keys.length === 1 && Object.keys(base).length === 0) {
      return
    }

    const slots = sharedState.slots.get(recipeName)

    if (slots) {
      //
      slots.forEach((slot) => {
        const rule = this.rules.get(slot)
        rule?.process({ styles })
      })
    } else {
      //

      const rule = this.rules.get(recipeName)
      rule?.process({ styles })
      //
    }
  }

  toCss = () => {
    if (!this.context) return ''
    return this.context.root.toString()
  }
}
