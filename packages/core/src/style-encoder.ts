import {
  getOrCreateSet,
  getSlotRecipes,
  isObjectOrArray,
  normalizeStyleObject,
  toResponsiveObject,
  traverse,
} from '@pandacss/shared'
import type {
  Dict,
  RecipeConfig,
  RecipeVariantRecord,
  ResultItem,
  ShipJson,
  SlotRecipeConfig,
  StyleEntry,
  StyleProps,
  StyleResultObject,
  SystemStyleObject,
} from '@pandacss/types'
import type { CoreContext } from './core-context'

const urlRegex = /^https?:\/\//

export class StyleEncoder {
  static separator = ']___['
  static conditionSeparator = '<___>'

  atomic = new Set<string>()
  compound_variants = new Set<string>()
  //
  recipes = new Map<string, Set<string>>()
  recipes_base = new Map<string, Set<string>>()

  constructor(private context: CoreContext) {}

  filterStyleProps(props: Dict): Dict {
    if (this.context.isTemplateLiteralSyntax) return props
    return filterProps(this.context.isValidProperty, props)
  }

  clone() {
    return new StyleEncoder(this.context)
  }

  isEmpty() {
    return !this.atomic.size && !this.recipes.size && !this.compound_variants.size && !this.recipes_base.size
  }

  get results() {
    return {
      atomic: this.atomic,
      recipes: this.recipes,
      recipes_base: this.recipes_base,
    }
  }
  /**
   * Hashes a style object and adds the resulting hashes to a set.
   * @param set - The set to add the resulting hashes to.
   * @param obj - The style object to hash.
   * @param baseEntry - An optional base style entry to use when hashing the style object.
   */
  hashStyleObject(
    set: Set<string>,
    obj: ResultItem['data'][number],
    baseEntry?: Partial<Omit<StyleEntry, 'prop' | 'value' | 'cond'>>,
  ) {
    const isCondition = this.context.conditions.isCondition
    const traverseOptions = { separator: StyleEncoder.conditionSeparator }

    // Is the final (leading to a raw value, not an object) property a condition ?
    // mx: { base: { p: 4, _hover: 5 } }
    //                            ^^^
    let prop = ''
    let prevProp = ''

    // { mx: 4 } => { marginX: 4 }
    const isRecipe = !!baseEntry?.variants
    const normalized = normalizeStyleObject(obj, this.context, !isRecipe)

    traverse(
      normalized,
      ({ key, value: rawValue, path }) => {
        if (rawValue === undefined) {
          return
        }

        // we don't want to extract and generate invalid CSS for urls
        if (urlRegex.test(rawValue)) {
          return
        }

        // { mx: [1, 2, 3] } => { mx: { base: 1, sm: 2, md: 3 } }
        const value = Array.isArray(rawValue)
          ? toResponsiveObject(rawValue, this.context.conditions.breakpoints.keys)
          : rawValue

        prop = key

        // { _hover: { ... } }
        //   ^^^^^^
        if (isCondition(key)) {
          // { _hover: { ... } }
          //           ^^^^^^^
          if (isObjectOrArray(value)) {
            return
          }

          // { _hover: { base: 4 } }
          //             ^^^^^^^
          prop = prevProp
        } else if (isObjectOrArray(value)) {
          // { mx: { base: 4 } }
          //       ^^^^^^^^^^^
          prevProp = prop
          return
        }

        const resolvedCondition = getResolvedCondition(path, isCondition)

        const hashed = hashStyleEntry(Object.assign(baseEntry ?? {}, { prop, value, cond: resolvedCondition }))
        set.add(hashed)

        prevProp = prop
      },
      traverseOptions,
    )
  }

  processAtomic(styles: StyleResultObject) {
    this.hashStyleObject(this.atomic, styles)
  }

  processStyleProps(styleProps: StyleProps) {
    const styles = this.filterStyleProps(styleProps)

    if (styles.css) {
      this.processAtomic(styles.css)
    }

    this.processAtomic(styles.css ? Object.assign({}, styles, { css: undefined }) : styles)
  }

  processRecipe(recipeName: string, variants: RecipeVariantRecord) {
    const config = this.context.recipes.getConfig(recipeName)
    if (!config) return

    if ('slots' in config) {
      config.slots.forEach((slot) => {
        const recipeKey = this.context.recipes.getSlotKey(recipeName, slot)
        const slotBase = config.base?.[slot]
        if (slotBase && !this.recipes_base.has(recipeKey)) {
          const base_set = getOrCreateSet(this.recipes_base, recipeKey)
          this.hashStyleObject(base_set, slotBase, { recipe: recipeName, slot })
        }
      })
    } else if (config.base && !this.recipes_base.has(recipeName)) {
      const base_set = getOrCreateSet(this.recipes_base, recipeName)
      this.hashStyleObject(base_set, config.base, { recipe: recipeName })
    }

    const set = getOrCreateSet(this.recipes, recipeName)
    const variantObj = Object.assign({}, config.defaultVariants, variants)
    this.hashStyleObject(set, variantObj, { recipe: recipeName, variants: true })

    if (config.compoundVariants && !this.compound_variants.has(recipeName)) {
      this.compound_variants.add(recipeName)
      config.compoundVariants.forEach((compoundVariant) => {
        this.processAtomic(compoundVariant.css)
      })
    }
  }

  processPattern(
    name: string,
    patternProps: StyleResultObject,
    type?: 'pattern' | 'jsx-pattern',
    jsxName?: string | undefined,
  ) {
    let fnName = name
    if (type === 'jsx-pattern' && jsxName) {
      fnName = this.context.patterns.find(jsxName)
    }
    const styleProps = this.context.patterns.transform(fnName, patternProps)
    this.processStyleProps(styleProps)
  }

  processAtomicRecipe(recipe: Pick<RecipeConfig, 'base' | 'variants' | 'compoundVariants'>) {
    const { base = {}, variants = {}, compoundVariants = [] } = recipe
    this.processAtomic(base)
    for (const variant of Object.values(variants)) {
      for (const styles of Object.values(variant)) {
        this.processAtomic(styles)
      }
    }

    compoundVariants.forEach((compoundVariant) => {
      this.processAtomic(compoundVariant.css)
    })
  }

  processAtomicSlotRecipe(
    recipe: Pick<SlotRecipeConfig, 'base' | 'variants' | 'compoundVariants'> & Partial<Pick<SlotRecipeConfig, 'slots'>>,
  ) {
    if (!recipe.slots) {
      recipe.slots = Array.from(inferSlots(recipe as any))
    }

    const slots = getSlotRecipes(recipe)
    for (const slotRecipe of Object.values(slots)) {
      this.processAtomicRecipe(slotRecipe)
    }
  }

  toJSON() {
    return {
      atomic: Array.from(this.atomic),
      recipes: Object.fromEntries(Array.from(this.recipes.entries()).map(([name, set]) => [name, Array.from(set)])),
    }
  }

  fromJSON(json: string) {
    const data = JSON.parse(json) as ShipJson
    const { styles } = data

    ;(styles.atomic ?? []).forEach((hash) => this.atomic.add(hash))

    Object.entries(styles.recipes ?? {}).forEach(([recipeName, hashes]) => {
      const config = this.context.recipes.getConfig(recipeName)
      if (!config) return

      if ('slots' in config) {
        config.slots.forEach((slot) => {
          const recipeKey = this.context.recipes.getSlotKey(recipeName, slot)
          if (!this.recipes_base.has(recipeKey)) {
            const slotBase = config.base?.[slot]
            const base_set = getOrCreateSet(this.recipes_base, recipeKey)
            this.hashStyleObject(base_set, slotBase as SystemStyleObject, { recipe: recipeName })
          }
        })
      } else if (!this.recipes_base.has(recipeName)) {
        const base_set = getOrCreateSet(this.recipes_base, recipeName)
        this.hashStyleObject(base_set, config.base as SystemStyleObject, { recipe: recipeName })
      }

      const set = getOrCreateSet(this.recipes, recipeName)
      hashes.forEach((hash) => set.add(hash))
    })

    return this
  }
}

const filterProps = (isValidProperty: (key: string) => boolean, props: Dict) => {
  const clone = {} as Dict
  for (const [key, value] of Object.entries(props)) {
    if (isValidProperty(key) && value !== undefined) {
      clone[key] = value
    }
  }
  return clone
}

const hashStyleEntry = (entry: StyleEntry) => {
  const parts = [`${entry.prop}${StyleEncoder.separator}value:${entry.value}`]

  if (entry.cond) {
    parts.push(`cond:${entry.cond}`)
  }

  if (entry.recipe) {
    parts.push(`recipe:${entry.recipe}`)
  }

  if (entry.layer) {
    parts.push(`layer:${entry.layer}`)
  }

  if (entry.slot) {
    parts.push(`slot:${entry.slot}`)
  }

  return parts.join(StyleEncoder.separator)
}

/**
 * Returns the final condition string after filtering out irrelevant parts. ('base' and props)
 * @example
 * 'marginTop<___>md' => 'md'
 * 'marginTop<___>md<___>lg' => 'md<___>lg'
 * '_hover' => '_hover'
 * '& > p<___>base', => '& > p'
 * '@media base' => '@media base'
 * '_hover<___>base<___>_dark' => '_hover<___>_dark'
 *
 */
const getResolvedCondition = (cond: string, isCondition: (key: string) => boolean): string => {
  if (!cond) {
    return ''
  }

  const parts = cond.split(StyleEncoder.conditionSeparator)
  const relevantParts = parts.filter((part) => part !== 'base' && isCondition(part))

  if (parts.length !== relevantParts.length) {
    return relevantParts.join(StyleEncoder.conditionSeparator)
  }

  return cond
}

const inferSlots = (recipe: SlotRecipeConfig) => {
  const slots = new Set<string>()
  Object.keys(recipe.base ?? {}).forEach((name) => {
    slots.add(name)
  })

  Object.values(recipe.variants ?? {}).forEach((variants) => {
    Object.keys(variants).forEach((name) => {
      slots.add(name)
    })
  })

  return slots
}
