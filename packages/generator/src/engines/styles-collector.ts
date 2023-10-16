import { sortStyleRules } from '@pandacss/core'
import { esc, getOrCreateSet, isImportant, toHash, withoutImportant } from '@pandacss/shared'
import type {
  AtomicStyleResult,
  GroupedResult,
  GroupedStyleResultDetails,
  RecipeBaseResult,
  StyleEntry,
  StyleResultObject,
} from '@pandacss/types'
import { HashCollector, type CollectorContext } from './hash-collector'

export class StylesCollector {
  constructor(private context: CollectorContext) {}

  classNames = new Map<string, AtomicStyleResult | RecipeBaseResult>()
  //
  atomic = new Set<AtomicStyleResult>()
  //
  recipes = new Map<string, Set<AtomicStyleResult>>()
  recipes_base = new Map<string, Set<RecipeBaseResult>>()
  //
  recipes_slots = new Map<string, Set<AtomicStyleResult>>()
  recipes_slots_base = new Map<string, Set<RecipeBaseResult>>()

  private entryKeys = ['cond', 'recipe', 'layer', 'slot'] as const

  // AtomicRule.hashFn
  hashSelector = (conditions: string[], className: string) => {
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

  private getEntryFromHash(hash: string) {
    const parts = hash.split(HashCollector.separator)
    const prop = parts[0]
    const value = parts[1].replace('value:', '')
    const entry = { prop, value } as StyleEntry

    parts.forEach((part) => {
      const key = this.entryKeys.find((k) => part.startsWith(k))
      if (key) {
        entry[key] = part.slice(key.length + 1)
      }
    })

    return entry
  }

  private getAtomicStyleResultFromHash(hash: string) {
    const entry = this.getEntryFromHash(hash)

    const recipeName = entry.recipe
      ? entry.slot
        ? this.context.recipes.getSlotKey(entry.recipe, entry.slot)
        : entry.recipe
      : undefined

    const transform = recipeName ? this.context.recipes.getTransform(recipeName) : this.context.utility.transform
    const transformed = transform(entry.prop, withoutImportant(entry.value))
    const important = isImportant(entry.value)

    // console.log({ entry, transformed })

    // TODO handle important + multiple properties with transformed.styles
    // const cssRoot = toCss(transformed.styles, { important })
    // console.log({
    //   styles: transformed.styles,
    //   // truncate: toCss(this.context.utility.transform('truncate', 'true').styles).toString(),
    // })
    let obj = {} as StyleResultObject
    const parts = entry.cond ? entry.cond.split(HashCollector.conditionSeparator) : []
    const className = this.hashSelector(parts, transformed.className)
    // TODO make l'avant dernier selector cond.at(-2) avec un !important
    const classSelector = important ? `.${className}\\!` : `.${className}`
    const basePath = [classSelector]

    let conditions
    if (entry.cond) {
      conditions = this.context.conditions.sort(parts)
      const path = basePath.concat(conditions.map((c) => c.rawValue ?? c.raw))
      obj = makeObjAt(path, transformed.styles)
    } else {
      obj = makeObjAt(basePath, transformed.styles)
    }

    return { result: obj, entry, hash, conditions, className } as AtomicStyleResult
  }

  private getGroupedStyleResultFromHashSet(hashSet: Set<string>) {
    let obj = {}
    const basePath = [] as string[]
    const details = [] as GroupedStyleResultDetails[]

    hashSet.forEach((hash) => {
      const entry = this.getEntryFromHash(hash)

      const transform = this.context.utility.transform
      const transformed = transform(entry.prop, withoutImportant(entry.value))

      const parts = entry.cond ? entry.cond.split(HashCollector.conditionSeparator) : []

      let conditions
      if (entry.cond) {
        conditions = this.context.conditions.sort(parts)
        const path = basePath.concat(conditions.map((c) => c.rawValue ?? c.raw))
        obj = setValueIn(obj, path, transformed.styles)
      } else {
        obj = setValueIn(obj, basePath, transformed.styles)
      }

      details.push({ hash, entry })

      // console.log({ obj, entry, className, transformed })
    })

    return { result: obj, hashSet } as GroupedResult
  }

  private getRecipeBaseStyleResultFromHash(hashSet: Set<string>, recipeName: string) {
    const recipe = this.context.recipes.getConfig(recipeName)
    if (!recipe) return

    const style = this.getGroupedStyleResultFromHashSet(hashSet)
    const base = { ['.' + recipe.className]: style.result }
    return Object.assign(style, { result: base, recipe: recipeName, className: recipe.className }) as RecipeBaseResult
  }

  /**
   * Collect all styles and recipes
   * and return a new ParserResult (collector, will not hash) with deduplicated ResultItem
   */
  collect(hashCollector: HashCollector) {
    // console.time('unpack')
    const atomic = [] as AtomicStyleResult[]

    hashCollector.atomic.forEach((item) => {
      atomic.push(this.getAtomicStyleResultFromHash(item))
    })

    sortStyleRules(atomic).forEach((styleResult) => {
      this.atomic.add(styleResult)
      this.classNames.set(styleResult.className, styleResult)
    })

    // no need to sort, each recipe is scoped using recipe.className (?)
    hashCollector.recipes.forEach((set, recipeName) => {
      set.forEach((item) => {
        const styleResult = this.getAtomicStyleResultFromHash(item)
        const set = getOrCreateSet(this.recipes, recipeName)
        set.add(styleResult)

        this.classNames.set(styleResult.className, styleResult)
      })
    })
    hashCollector.recipes_base.forEach((set, recipeName) => {
      const recipeBase = this.getRecipeBaseStyleResultFromHash(set, recipeName)
      if (recipeBase) {
        const recipeName = recipeBase.recipe
        const set = getOrCreateSet(this.recipes_base, recipeName)
        set.add(recipeBase)

        this.classNames.set(recipeBase.className, recipeBase)
      }
    })

    //
    hashCollector.recipes_slots.forEach((set, recipeName) => {
      set.forEach((item) => {
        const styleResult = this.getAtomicStyleResultFromHash(item)
        const set = getOrCreateSet(this.recipes_slots, recipeName)
        set.add(styleResult)

        this.classNames.set(styleResult.className, styleResult)
      })
    })
    hashCollector.recipes_slots_base.forEach((set, recipeName) => {
      const recipeBase = this.getRecipeBaseStyleResultFromHash(set, recipeName)
      if (recipeBase) {
        const recipeName = recipeBase.recipe
        const set = getOrCreateSet(this.recipes_slots_base, recipeName)
        set.add(recipeBase)

        this.classNames.set(recipeBase.className, recipeBase)
      }
    })

    // console.timeEnd('unpack')
    return this
  }
}

const makeObjAt = (path: string[], value: Record<string, unknown>) => {
  if (!path.length) return value as StyleResultObject

  const obj = {} as StyleResultObject
  let current = obj
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      current[key] = value
    } else {
      current[key] = {}
      current = current[key] as StyleResultObject
    }
  }

  return obj
}

const setValueIn = (obj: StyleResultObject, path: string[], value: Record<string, unknown>) => {
  if (!path.length) return Object.assign(obj, value) as StyleResultObject

  let current = obj as Record<string, any>
  for (let i = 0; i < path.length; i++) {
    const key = path[i]
    if (i === path.length - 1) {
      if (!current) {
        current = {}
      }

      current[key] = Object.assign(current[key] ?? {}, value)
    } else {
      current = current[key]
    }
  }

  return obj
}
