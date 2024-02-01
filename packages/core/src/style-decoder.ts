import {
  PandaError,
  deepSet,
  esc,
  getOrCreateSet,
  isImportant,
  markImportant,
  withoutImportant,
} from '@pandacss/shared'
import type {
  AtomicStyleResult,
  Dict,
  GroupedResult,
  GroupedStyleResultDetails,
  RawCondition,
  RecipeBaseResult,
  StyleEntry,
  StyleResultObject,
} from '@pandacss/types'
import type { Context } from './context'
import { sortStyleRules } from './sort-style-rules'
import { StyleEncoder } from './style-encoder'

import { Recipes } from './recipes'

export class StyleDecoder {
  constructor(private context: Pick<Context, 'conditions' | 'utility' | 'recipes' | 'hash'>) {}

  classNames = new Map<string, AtomicStyleResult | RecipeBaseResult>()
  //
  atomic_cache = new Map<string, AtomicStyleResult>()
  group_cache = new Map<string, GroupedResult>()
  //
  atomic = new Set<AtomicStyleResult>()
  //
  recipes = new Map<string, Set<AtomicStyleResult>>()
  recipes_base = new Map<string, Set<RecipeBaseResult>>()

  clone = () => {
    return new StyleDecoder(this.context)
  }

  isEmpty = () => {
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
      result = utility.formatClassName(utility.toHash(conds, utility.defaultHashFn))
    } else {
      conds.push(utility.formatClassName(className))
      result = conds.join(':')
    }

    return esc(result)
  }

  private getRecipeName = (hash: string) => {
    const entry = getEntryFromHash(hash)
    if (!entry.recipe) return
    return entry.slot ? this.context.recipes.getSlotKey(entry.recipe, entry.slot) : entry.recipe
  }

  private getTransformResult = (hash: string) => {
    const entry = getEntryFromHash(hash)
    const recipeName = this.getRecipeName(hash)

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

    return {
      className,
      classSelector,
      styles,
      transformed,
      parts,
    }
  }

  resolveCondition = (condition: RawCondition) => {
    return this.context.utility.tokens.resolveReference(condition.rawValue ?? condition.raw)
  }

  private getAtomic = (hash: string) => {
    const cached = this.atomic_cache.get(hash)
    if (cached) return cached

    const entry = getEntryFromHash(hash)

    const transformResult = this.getTransformResult(hash)
    if (!transformResult) return

    const { className, classSelector, styles, transformed, parts } = transformResult

    const basePath = [classSelector]

    const obj: StyleResultObject = {}

    let conditions

    if (entry.cond) {
      conditions = this.context.conditions.sort(parts)
      const path = basePath.concat(conditions.map((c) => this.resolveCondition(c)))
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

  getGroup = (hashSet: Set<string>, key: string) => {
    const cached = this.group_cache.get(key)
    if (cached) return cached

    let obj = {}
    const basePath = [] as string[]
    const details = [] as GroupedStyleResultDetails[]
    const transform = this.context.utility.transform.bind(this.context.utility)

    hashSet.forEach((hash) => {
      const entry = getEntryFromHash(hash)

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

    // sorting here prevents postcss-nested from creating multiple rules with the same selector
    // if we have a rule without a condition, then one with a condition, then one without a condition
    // if not sorted, the object would look like
    // 1. `{ lineHeight: '1.2', _hover: { boxShadow: 'outline' }, outline: 'none', }`
    // instead of
    // 2. `{ lineHeight: '1.2', outline: 'none', _hover: { boxShadow: 'outline' } }`
    //
    // which would result in a CSS like
    // 1. `.class { line-height: 1.2; } .class:hover { box-shadow: outline; } .class { outline: none }`
    // instead of:
    // 2. `.class { line-height: 1.2; outline: none; } .class:hover { box-shadow: outline; }`
    const sorted = sortStyleRules(details)
    sorted.forEach((value) => {
      if (value.conditions) {
        const path = basePath.concat(value.conditions.map((c) => this.resolveCondition(c)))
        obj = deepSet(obj, path, value.result)
      } else {
        obj = deepSet(obj, basePath, value.result)
      }
    })

    const result: GroupedResult = { result: obj, hashSet, details, className: key }

    this.group_cache.set(key, result)

    return result
  }

  private getRecipeBase = (hashSet: Set<string>, recipeName: string, slot?: string): RecipeBaseResult | undefined => {
    const recipeConfig = this.context.recipes.getConfig(recipeName)
    if (!recipeConfig) return

    const className =
      'slots' in recipeConfig && slot
        ? this.context.recipes.getSlotKey(recipeConfig.className, slot)
        : recipeConfig.className

    const selector = this.formatSelector([], className)
    const style = this.getGroup(hashSet, className)

    return Object.assign({}, style, {
      result: { ['.' + selector]: style.result },
      recipe: recipeName,
      className,
      slot,
    })
  }

  collectAtomic = (encoder: StyleEncoder) => {
    const atomic = [] as AtomicStyleResult[]
    encoder.atomic.forEach((item) => {
      const result = this.getAtomic(item)
      if (!result) return

      atomic.push(result)
    })

    const sorted = sortStyleRules(atomic)
    sorted.forEach((styleResult) => {
      this.atomic.add(styleResult)
      this.classNames.set(styleResult.className, styleResult)
    })

    return this
  }

  private processClassName = (recipeName: string, hash: string) => {
    const result = this.getAtomic(hash)
    if (!result) return

    const styleSet = getOrCreateSet(this.recipes, recipeName)
    styleSet.add(result)

    this.classNames.set(result.className, result)
  }

  collectRecipe = (encoder: StyleEncoder) => {
    // no need to sort, each recipe is scoped using recipe.className
    encoder.recipes.forEach((hashSet, recipeName) => {
      const recipeConfig = this.context.recipes.getConfig(recipeName)
      if (!recipeConfig) return

      hashSet.forEach((hash) => {
        if ('slots' in recipeConfig) {
          recipeConfig.slots.forEach((slot) => {
            const slotHash = hash + StyleEncoder.separator + 'slot:' + slot
            this.processClassName(recipeName, slotHash)
          })
        } else {
          this.processClassName(recipeName, hash)
        }
      })
    })
  }

  collectRecipeBase = (encoder: StyleEncoder) => {
    encoder.recipes_base.forEach((hashSet, recipeKey) => {
      const [recipeName, slot] = recipeKey.split(this.context.recipes.slotSeparator)

      const recipeConfig = this.context.recipes.getConfig(recipeName)
      if (!recipeConfig) return

      const result = this.getRecipeBase(hashSet, recipeName, slot)
      if (!result) return

      const styleSet = getOrCreateSet(this.recipes_base, recipeKey)
      styleSet.add(result)

      this.classNames.set(result.className, result)
    })
  }

  /**
   * Collect and re-create all styles and recipes objects from the style encoder
   * So that we can just iterate over them and transform resulting CSS objects into CSS strings
   */
  collect = (encoder: StyleEncoder) => {
    this.collectAtomic(encoder)
    this.collectRecipe(encoder)
    this.collectRecipeBase(encoder)
    return this
  }

  getConfigRecipeResult = (recipeName: string) => {
    return {
      atomic: this.atomic,
      base: this.recipes_base.get(recipeName)!,
      variants: this.recipes.get(recipeName)!,
    }
  }

  getConfigSlotRecipeResult = (recipeName: string) => {
    const recipeConfig = this.context.recipes.getConfigOrThrow(recipeName)

    if (!Recipes.isSlotRecipeConfig(recipeConfig)) {
      throw new PandaError('UNKNOWN_RECIPE', `Recipe "${recipeName}" is not a slot recipe`)
    }

    const base: Dict = {}

    recipeConfig.slots.map((slot) => {
      const recipeKey = this.context.recipes.getSlotKey(recipeName, slot)
      base[slot] = this.recipes_base.get(recipeKey)!
    })

    return {
      atomic: this.atomic,
      base,
      variants: this.recipes.get(recipeName)!,
    }
  }

  getRecipeResult = (recipeName: string) => {
    if (this.context.recipes.isSlotRecipe(recipeName)) {
      return this.getConfigSlotRecipeResult(recipeName)
    }

    return this.getConfigRecipeResult(recipeName)
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
  if (!Number.isNaN(asNumber)) return asNumber
  return castBoolean(value)
}

const castBoolean = (value: string) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}
