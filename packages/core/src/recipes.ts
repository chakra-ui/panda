import { capitalize, createRegex, dashCase, getSlotRecipes, memo, splitProps } from '@pandacss/shared'
import type { ArtifactFilters, Dict, RecipeConfig, SlotRecipeConfig, SystemStyleObject } from '@pandacss/types'
import merge from 'lodash.merge'
import { AtomicRule, createRecipeAtomicRule, type ProcessOptions } from './atomic-rule'
import { isSlotRecipe } from './is-slot-recipe'
import { serializeStyle } from './serialize'
import type { RecipeContext, RecipeNode } from './types'

interface RecipeRecord {
  [key: string]: RecipeConfig | SlotRecipeConfig
}

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
  nodes: new Map<string, RecipeNode>(),
  /**
   * The map of recipe key to slot key + slot recipe
   */
  slots: new Map<string, Map<string, RecipeConfig>>(),
}

export class Recipes {
  /**
   * The map of the recipes to their atomic rules
   */
  rules: Map<string, AtomicRule> = new Map()

  get keys() {
    return Object.keys(this.recipes)
  }

  constructor(private recipes: RecipeRecord = {}, private context: RecipeContext) {
    this.prune()
    this.save()
  }

  private getPropKey = (recipe: string, variant: string, value: any) => {
    return `${recipe} (${variant} = ${value})`
  }

  private get separator() {
    return this.context.utility.separator ?? '_'
  }

  private getClassName = (className: string, variant: string, value: string) => {
    return `${className}--${variant}${this.separator}${value}`
  }

  // check this.recipes against sharedState.nodes
  // and remove any recipes (in sharedState) that are no longer in use
  prune = () => {
    const recipeNames = Object.keys(this.recipes)
    const cachedRecipeNames = Array.from(sharedState.nodes.keys())
    const removedRecipes = cachedRecipeNames.filter((name) => !recipeNames.includes(name))
    removedRecipes.forEach((name) => {
      this.remove(name)
    })
  }

  save = () => {
    for (const [name, recipe] of Object.entries(this.recipes)) {
      this.saveOne(name, recipe)
    }
  }

  saveOne = (name: string, recipe: RecipeConfig | SlotRecipeConfig) => {
    if (isSlotRecipe(recipe)) {
      // extract recipes for each slot
      const slots = getSlotRecipes(recipe)

      const slotsMap = new Map()

      // normalize each recipe
      Object.entries(slots).forEach(([slot, slotRecipe]) => {
        const slotName = this.getSlotKey(name, slot)
        this.normalize(slotName, slotRecipe)
        slotsMap.set(slotName, slotRecipe)
        this.rules.set(slotName, this.createRule(slotName, true))
      })

      // save the root recipe
      this.assignRecipe(name, recipe)
      sharedState.slots.set(name, slotsMap)
      //
    } else {
      this.assignRecipe(name, this.normalize(name, recipe))
      this.rules.set(name, this.createRule(name))
    }
  }

  remove(name: string) {
    this.rules.delete(name)
    sharedState.nodes.delete(name)
    sharedState.classNames.delete(name)
    sharedState.styles.delete(name)
  }

  private assignRecipe = (name: string, recipe: RecipeConfig | SlotRecipeConfig) => {
    const variantKeys = Object.keys(recipe.variants ?? {})
    const capitalized = capitalize(name)
    const jsx = recipe.jsx ?? [capitalized]
    if ('slots' in recipe) {
      jsx.push(...recipe.slots.map((slot) => capitalized + '.' + capitalize(slot)))
    }

    const match = createRegex(jsx)

    sharedState.nodes.set(name, {
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
  }

  getSlotKey = (name: string, slot: string) => {
    return `${name}__${slot}`
  }

  isEmpty = () => {
    return sharedState.nodes.size === 0
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
    return sharedState.nodes.get(name)
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
    return Array.from(sharedState.nodes.values())
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
      staticCss = [],
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
      staticCss,
    }

    recipe.base = this.serialize(base)

    sharedState.styles.set(name, recipe.base)
    sharedState.classNames.set(name, className)

    for (const [key, variant] of Object.entries(variants)) {
      for (const [variantKey, styles] of Object.entries(variant)) {
        const propKey = this.getPropKey(name, key, variantKey)
        const className = this.getClassName(config.className, key, variantKey)

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
    return serializeStyle(styleObject, this.context)
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

  private createRule = (name: string, slot?: boolean) => {
    if (!this.context) {
      throw new Error("Can't create a rule without a context")
    }

    const context = {
      ...this.context,
      transform: this.getTransform(name),
    }

    const rule = createRecipeAtomicRule(context, slot)

    return rule
  }

  private check = (config: RecipeConfig, className: string, variants: Dict) => {
    const { defaultVariants = {}, base = {} } = config

    const styles = Object.assign({ [className]: '__ignore__' }, defaultVariants, variants)
    const keys = Object.keys(styles)

    return { styles, isEmpty: keys.length === 1 && Object.keys(base).length === 0 }
  }

  process = (recipeName: string, options: ProcessOptions) => {
    const { styles: variants } = options

    const recipe = this.getRecipe(recipeName)
    if (!recipe) return

    const slots = sharedState.slots.get(recipeName)

    if (slots) {
      //
      slots.forEach((slotRecipe, slotKey) => {
        const { isEmpty, styles } = this.check(slotRecipe, slotKey, variants)
        if (isEmpty) return

        const rule = this.rules.get(slotKey)
        if (!rule) return

        const normalizedStyles = rule?.normalize(styles, false)
        rule.process({ styles: normalizedStyles })
      })
      //
    } else {
      //
      const { isEmpty, styles } = this.check(recipe.config, recipe.config.className, variants)
      if (isEmpty) return

      const rule = this.rules.get(recipeName)
      if (!rule) return

      const normalizedStyles = rule.normalize(styles, false)
      rule.process({ styles: normalizedStyles })
      //
    }
  }

  filterDetails = (filters?: ArtifactFilters) => {
    const recipeDiffs = filters?.affecteds?.recipes
    return recipeDiffs ? this.details.filter((recipe) => recipeDiffs.includes(recipe.dashName)) : this.details
  }
}
