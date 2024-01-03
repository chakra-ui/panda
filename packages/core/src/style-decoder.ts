import { esc, getOrCreateSet, isImportant, markImportant, toHash, withoutImportant } from '@pandacss/shared'
import type {
  AtomicStyleResult,
  GroupedResult,
  GroupedStyleResultDetails,
  RecipeBaseResult,
  StyleDecoderInterface,
  StyleEntry,
  StyleResultObject,
} from '@pandacss/types'
import type { CoreContext } from './core-context'
import { deepSet } from './deep-set'
import { StyleEncoder } from './style-encoder'

export class StyleDecoder implements StyleDecoderInterface {
  constructor(private context: CoreContext) {}

  classNames = new Map<string, AtomicStyleResult | RecipeBaseResult>()
  //
  atomic_cache = new Map<string, AtomicStyleResult>()
  group_cache = new Map<string, GroupedResult>()
  //
  atomic = new Set<AtomicStyleResult>()
  //
  recipes = new Map<string, Set<AtomicStyleResult>>()
  recipes_base = new Map<string, Set<RecipeBaseResult>>()

  clone() {
    return new StyleDecoder(this.context)
  }

  isEmpty() {
    return !this.atomic.size && !this.recipes.size && !this.recipes_base.size
  }

  get results() {
    return {
      atomic: this.atomic,
      recipes: this.recipes,
      recipes_base: this.recipes_base,
    }
  }

  private formatSelector = (conditions: string[], className: string) => {
    const { conditions: cond, hash, utility } = this.context

    const conds = cond.finalize(conditions)
    let result: string

    if (hash.className) {
      conds.push(className)
      result = utility.formatClassName(toHash(conds.join(':')))
    } else {
      conds.push(utility.formatClassName(className))
      result = conds.join(':')
    }

    return esc(result)
  }

  private getAtomic(hash: string) {
    const cached = this.atomic_cache.get(hash)
    if (cached) return cached

    const entry = getEntryFromHash(hash)

    const recipeName = entry.recipe
      ? entry.slot
        ? this.context.recipes.getSlotKey(entry.recipe, entry.slot)
        : entry.recipe
      : undefined

    const transform = recipeName ? this.context.recipes.getTransform(recipeName) : this.context.utility.transform
    const transformed = transform(entry.prop, withoutImportant(entry.value) as string)

    if (!transformed.className) {
      return
    }

    const important = isImportant(entry.value)
    const styles = important ? markImportant(transformed.styles) : transformed.styles

    const parts = entry.cond ? entry.cond.split(StyleEncoder.conditionSeparator) : []
    const className = this.formatSelector(parts, transformed.className)
    const classSelector = important ? `.${className}\\!` : `.${className}`

    const basePath = [classSelector]

    const obj = {} as StyleResultObject
    let conditions

    if (entry.cond) {
      conditions = this.context.conditions.sort(parts)
      const path = basePath.concat(conditions.map((c) => c.rawValue ?? c.raw))
      deepSet(obj, path, styles)
    } else {
      deepSet(obj, basePath, styles)
    }

    const styleResult: AtomicStyleResult = {
      result: obj,
      entry,
      hash,
      conditions,
      className,
      layer: transformed.layer,
    }

    this.atomic_cache.set(hash, styleResult)

    return styleResult
  }

  private getGroup(hashSet: Set<string>, className: string) {
    const cached = this.group_cache.get(className)
    if (cached) return cached

    let obj = {}
    const basePath = [] as string[]
    const details = [] as GroupedStyleResultDetails[]

    hashSet.forEach((hash) => {
      const entry = getEntryFromHash(hash)

      const transform = this.context.utility.transform
      const transformed = transform(entry.prop, withoutImportant(entry.value) as string)

      if (!transformed.className) return

      const important = isImportant(entry.value)
      const result = important ? markImportant(transformed.styles) : transformed.styles

      const parts = entry.cond ? entry.cond.split(StyleEncoder.conditionSeparator) : []

      let conditions
      if (entry.cond) {
        conditions = this.context.conditions.sort(parts)
      }

      details.push({ hash, entry, conditions, result })
    })

    // TODO sort
    details.forEach((value) => {
      if (value.conditions) {
        const path = basePath.concat(value.conditions.map((c) => c.rawValue ?? c.raw))
        obj = deepSet(obj, path, value.result)
      } else {
        obj = deepSet(obj, basePath, value.result)
      }
    })

    const result: GroupedResult = { result: obj, hashSet, details, className }
    this.group_cache.set(className, result)
    return result
  }

  private getRecipeBase(hashSet: Set<string>, recipeName: string, slot?: string) {
    const recipe = this.context.recipes.getConfig(recipeName)
    if (!recipe) return

    const className =
      'slots' in recipe && slot ? this.context.recipes.getSlotKey(recipe.className, slot) : recipe.className
    const classSelector = this.formatSelector([], className)
    const style = this.getGroup(hashSet, className)

    const base = { ['.' + classSelector]: style.result }
    return Object.assign({}, style, { result: base, recipe: recipeName, className, slot }) as RecipeBaseResult
  }

  /**
   * Collect and re-create all styles and recipes objects from the style encoder
   * So that we can just iterate over them and transform resulting CSS objects into CSS strings
   */
  collect(encoder: StyleEncoder) {
    const atomic = [] as AtomicStyleResult[]

    encoder.atomic.forEach((item) => {
      const styleResult = this.getAtomic(item)
      if (!styleResult) return

      atomic.push(styleResult)
    })

    // TODO sort
    atomic.forEach((styleResult) => {
      this.atomic.add(styleResult)
      this.classNames.set(styleResult.className, styleResult)
    })

    // no need to sort, each recipe is scoped using recipe.className
    encoder.recipes.forEach((set, recipeName) => {
      const recipeConfig = this.context.recipes.getConfig(recipeName)
      if (!recipeConfig) return

      set.forEach((item) => {
        const process = (hash: string) => {
          const styleResult = this.getAtomic(hash)
          if (!styleResult) return

          const stylesSet = getOrCreateSet(this.recipes, recipeName)
          stylesSet.add(styleResult)

          this.classNames.set(styleResult.className, styleResult)
        }

        if ('slots' in recipeConfig) {
          recipeConfig.slots.forEach((slot) => process(item + StyleEncoder.separator + 'slot:' + slot))
        } else {
          process(item)
        }
      })
    })

    encoder.recipes_base.forEach((set, recipeKey) => {
      const [recipeName, slot] = recipeKey.split(this.context.recipes.slotSeparator)

      const recipeConfig = this.context.recipes.getConfig(recipeName)
      if (!recipeConfig) return

      const styleResult = this.getRecipeBase(set, recipeName, slot)
      if (!styleResult) return

      const stylesSet = getOrCreateSet(this.recipes_base, recipeKey)
      stylesSet.add(styleResult)

      this.classNames.set(styleResult.className, styleResult)
    })

    return this
  }
}

const entryKeys = ['cond', 'recipe', 'layer', 'slot'] as const

const getEntryFromHash = (hash: string) => {
  const parts = hash.split(StyleEncoder.separator)
  const prop = parts[0]

  const rawValue = parts[1].replace('value:', '')
  const value = parseValue(rawValue)

  const entry = { prop, value } as StyleEntry

  parts.forEach((part) => {
    const key = entryKeys.find((k) => part.startsWith(k))
    if (key) {
      entry[key] = part.slice(key.length + 1)
    }
  })

  return entry
}

const parseValue = (value: string) => {
  const asNumber = Number(value)
  if (!isNaN(asNumber)) {
    return asNumber
  }

  return castBoolean(value)
}

const castBoolean = (value: string) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}
