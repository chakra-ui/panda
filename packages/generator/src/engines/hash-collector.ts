import {
  getOrCreateSet,
  getSlotRecipes,
  isObjectOrArray,
  normalizeStyleObject,
  toResponsiveObject,
  traverse,
  withoutImportant,
} from '@pandacss/shared'
import type {
  Dict,
  RecipeConfig,
  RecipeVariantRecord,
  ResultItem,
  SlotRecipeConfig,
  SlotRecipeVariantRecord,
  StyleEntry,
  StyleProps,
  StyleResultObject,
} from '@pandacss/types'
import type { GeneratorBaseEngine } from './base'
import { isSlotRecipe } from '@pandacss/core'

export interface CollectorContext
  extends Pick<
    GeneratorBaseEngine,
    'hash' | 'isTemplateLiteralSyntax' | 'isValidProperty' | 'conditions' | 'recipes' | 'utility' | 'patterns'
  > {}

const identity = (v: any) => v

export class HashCollector {
  static separator = ']___['
  static conditionSeparator = '<___>'

  atomic = new Set<string>()
  //
  recipes = new Map<string, Set<string>>()
  recipes_base = new Map<string, Set<string>>()
  //
  recipes_slots = new Map<string, Set<string>>()
  recipes_slots_base = new Map<string, Set<string>>()
  // TODO pattern ?

  private filterStyleProps: (props: Dict) => Dict

  constructor(private context: CollectorContext) {
    this.filterStyleProps = context.isTemplateLiteralSyntax
      ? identity
      : (props: Dict) => filterProps(this.context.isValidProperty, props)
  }

  hashStyleObject(
    set: Set<string>,
    obj: ResultItem['data'][number],
    baseEntry?: Partial<Omit<StyleEntry, 'prop' | 'value' | 'cond'>>,
  ) {
    const isCondition = this.context.conditions.isCondition
    const traverseOptions = { separator: HashCollector.conditionSeparator }

    // _dark: { color: 'white' }
    //          ^^^^^^^^^^^^^^
    let isInCondition = false

    // Is the final (leading to a raw value, not an object) property a condition ?
    // mx: { base: { p: 4, _hover: 5 } }
    //                            ^^^
    let isFinalCondition = false

    let cond = ''
    let prop = ''
    let prevProp = ''
    let prevDepth = 0

    const normalized = normalizeStyleObject(obj, this.context)

    // TODO stately diagram on how this works
    traverse(
      normalized,
      (key, rawValue, path, depth) => {
        if (rawValue === undefined) return

        const value = Array.isArray(rawValue)
          ? toResponsiveObject(rawValue, this.context.conditions.breakpoints.keys)
          : rawValue

        isFinalCondition = false
        prop = key
        if (isCondition(key)) {
          if (isObjectOrArray(value)) {
            isInCondition = true
            cond = path
            prevDepth = depth
            return
          }

          cond = isInCondition && cond ? path.replace(HashCollector.conditionSeparator + prevProp, '') : key
          prop = prevProp
          isFinalCondition = true
        }

        if (isObjectOrArray(value)) {
          prevProp = prop
          prevDepth = depth
          return
        }

        if (!isFinalCondition && isInCondition && !path.slice(prop.length)) {
          isInCondition = false
          cond = ''
        } else if (depth !== prevDepth && !isInCondition && !isFinalCondition) {
          cond = path.split(HashCollector.conditionSeparator).at(-2) ?? ''
          isInCondition = cond !== ''
        }

        let finalCondition = cond
        if (cond) {
          const parts = cond.split(HashCollector.conditionSeparator)
          const first = parts[0]
          // filterBaseConditions
          let relevantParts = parts.filter((p) => p !== 'base')

          if (first && !isCondition(first)) {
            relevantParts = relevantParts.slice(1)
          }

          if (parts.length !== relevantParts.length) {
            finalCondition = relevantParts.join(HashCollector.conditionSeparator)
          }
        }
        // TODO rm important from value
        const hashed = hashStyleEntry(
          Object.assign(baseEntry ?? {}, { prop, value: withoutImportant(value), cond: finalCondition }),
        )
        set.add(hashed)
        // console.log({ prop, value, cond, finalCondition, options, isInCondition, prevProp, isFinalCondition, path })
        // console.log({ hashed })

        prevProp = prop
        prevDepth = depth
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

    const set = getOrCreateSet(this.recipes, recipeName)
    const styles = Object.assign({}, config.defaultVariants, variants)
    this.hashStyleObject(set, styles, { recipe: recipeName })

    if (config.base && !this.recipes_base.has(recipeName)) {
      const base_set = getOrCreateSet(this.recipes_base, recipeName)
      this.hashStyleObject(base_set, config.base, { recipe: recipeName })
    }

    // TODO same as config.base
    // this.processCompoundVariants(config)
  }

  processSlotRecipe(recipeName: string, variants: SlotRecipeVariantRecord<string>) {
    const config = this.context.recipes.getConfig(recipeName) as SlotRecipeConfig | undefined
    if (!config) return

    config.slots.forEach((slot) => {
      const recipeKey = this.context.recipes.getSlotKey(recipeName, slot)
      // TODO ?
      // const styleObject = variants[slot]

      const set = getOrCreateSet(this.recipes_slots, recipeKey)
      const styles = Object.assign({}, config.defaultVariants, variants)
      this.hashStyleObject(set, styles, { recipe: recipeName, slot })

      if (config.base && !this.recipes_base.has(recipeKey)) {
        // console.log('base', { recipeKey, slot, recipeName })
        const base_set = getOrCreateSet(this.recipes_slots_base, recipeKey)
        this.hashStyleObject(base_set, config.base, { recipe: recipeName, slot })
      }
    })

    // TODO same as config.base
    // this.processCompoundVariants(config)
  }

  processPattern(
    patternName: string,
    type: 'pattern' | 'jsx-pattern',
    jsxName: string | undefined,
    patternProps: StyleResultObject,
  ) {
    let fnName = patternName
    if (type === 'jsx-pattern' && jsxName) {
      fnName = this.context.patterns.getFnName(jsxName)
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

  processAtomicSlotRecipe(recipe: Pick<SlotRecipeConfig, 'base' | 'variants' | 'compoundVariants'>) {
    const slots = getSlotRecipes(recipe)
    for (const slotRecipe of Object.values(slots)) {
      this.processAtomicRecipe(slotRecipe)
    }
  }

  processCompoundVariants(config: RecipeConfig | SlotRecipeConfig) {
    config.compoundVariants?.forEach((compoundVariant) => {
      if (isSlotRecipe(config)) {
        for (const css of Object.values(compoundVariant.css)) {
          this.processAtomic(css)
        }
      } else {
        // TODO check if we ever go that way, same in stylesheet.ts
        this.processAtomic(compoundVariant.css)
      }
    })
  }

  merge(result: HashCollector) {
    result.atomic.forEach((item) => this.atomic.add(item))

    result.recipes.forEach((items, name) => {
      const set = getOrCreateSet(this.recipes, name)
      items.forEach(set.add)
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
  const parts = [`${entry.prop}${HashCollector.separator}value:${entry.value}`]

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

  return parts.join(HashCollector.separator)
}
