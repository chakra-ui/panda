import { esc, isImportant, toHash, withoutImportant } from '@pandacss/shared'
import { HashCollector } from './hash-collector'
import {
  type AtomicStyleResult,
  type RecipeBaseResult,
  type StyleEntry,
  type StyleResultObject,
  type GroupedStyleResultDetails,
  type GroupedResult,
} from './style-rule-types'
import { getOrCreateSet } from './shared'
import { sortStyleRules } from './sort-style-rules'
import type { ParserOptions } from './parser'

export class StylesCollector {
  constructor(private context: ParserOptions) {}

  atomic = new Set<AtomicStyleResult>()
  recipes = new Map<string, Set<AtomicStyleResult>>()
  recipes_base = new Map<string, Set<RecipeBaseResult>>()
  filePath: string | undefined

  setFilePath(filePath: string | undefined) {
    this.filePath = filePath
    return this
  }

  // AtomicRule.hashFn
  hashSelector = (conditions: string[], className: string) => {
    const { conditions: cond, hash, utility } = this.context
    const conds = cond.finalize(conditions)
    let result: string
    if (hash) {
      conds.push(className)
      result = utility.formatClassName(toHash(conds.join(':')))
    } else {
      conds.push(utility.formatClassName(className))
      result = conds.join(':')
    }
    return esc(result)
  }

  getEntryFromHash(hash: string) {
    const [prop, value, ...rest] = hash.split(HashCollector.separator)
    const entry = { prop, value: value.replace('value:', '') } as StyleEntry

    // console.log({ prop, value, condOrRecipe, recipe, hash })
    rest.forEach((part) => {
      if (part.includes('cond:')) {
        entry.cond = part.replace('cond:', '')
      } else if (part.includes('recipe:')) {
        entry.recipe = part.replace('recipe:', '')
      } else if (part.includes('layer:')) {
        entry.layer = part.replace('layer:', '')
      }
    })

    return entry
  }

  getAtomicStyleResultFromHash(hash: string) {
    const entry = this.getEntryFromHash(hash)

    // TODO recipe slots
    const transform = entry.recipe ? this.context.recipes.getTransform(entry.recipe) : this.context.utility.transform
    const transformed = transform(entry.prop, withoutImportant(entry.value))
    const important = isImportant(entry.value)

    // TODO handle important + multiple properties with transformed.styles
    // TODO try recipe.base with conditions
    // const cssRoot = toCss(transformed.styles, { important })
    // console.log({
    //   styles: transformed.styles,
    //   entry,
    //   resolvedValue,
    //   // details: this.context.recipes.details,
    //   // cssRoot: cssRoot.toString(),
    //   // truncate: toCss(this.context.utility.transform('truncate', 'true').styles).toString(),
    // })
    let obj = {} as StyleResultObject
    const parts = entry.cond ? entry.cond.split(HashCollector.conditionSeparator) : []
    const selector = this.hashSelector(parts, transformed.className)
    // TODO make l'avant dernier selector cond.at(-2) avec un !important
    const className = important ? `.${selector}\\!` : `.${selector}`
    const basePath = [className]

    let conditions
    if (entry.cond) {
      conditions = this.context.conditions.sort(parts)
      const path = basePath.concat(conditions.map((c) => c.rawValue ?? c.raw))
      obj = makeObjAt(path, transformed.styles)
    } else {
      obj = makeObjAt(basePath, transformed.styles)
    }

    return { result: obj, entry, hash, conditions } as AtomicStyleResult
  }

  getGroupedStyleResultFromHashSet(hashSet: Set<string>) {
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

  getRecipeBaseStyleResultFromHash(hashSet: Set<string>, recipeName: string) {
    const recipe = this.context.recipes.getConfig(recipeName)
    if (!recipe) return

    const style = this.getGroupedStyleResultFromHashSet(hashSet)
    const base = { ['.' + recipe.className]: style.result }
    return Object.assign(style, { result: base, recipe: recipeName }) as RecipeBaseResult
  }

  /**
   * Collect all styles and recipes
   * and return a new ParserResult (collector, will not hash) with deduplicated ResultItem
   */
  collect(hashCollector: HashCollector) {
    // console.time('unpack')
    const atomic = [] as AtomicStyleResult[]
    const recipesBase = [] as RecipeBaseResult[]
    const recipes = [] as AtomicStyleResult[]

    hashCollector.stylesHash.css.forEach((item) => {
      atomic.push(this.getAtomicStyleResultFromHash(item))
    })
    hashCollector.stylesHash.recipe.forEach((set) => {
      set.forEach((item) => {
        recipes.push(this.getAtomicStyleResultFromHash(item))
      })
    })
    hashCollector.stylesHash.recipe_base.forEach((set, recipeName) => {
      const result = this.getRecipeBaseStyleResultFromHash(set, recipeName)
      if (result) {
        recipesBase.push(result)
      }
    })

    sortStyleRules(atomic).forEach((styleResult) => {
      this.atomic.add(styleResult)
    })

    sortStyleRules(recipes).forEach((styleResult) => {
      const recipeName = styleResult.entry.recipe
      if (!recipeName) return

      const set = getOrCreateSet(this.recipes, recipeName)
      set.add(styleResult)
    })

    // no need to sort, each recipe is scoped using recipe.className
    recipesBase.forEach((recipeBase) => {
      const recipeName = recipeBase.recipe
      const set = getOrCreateSet(this.recipes_base, recipeName)
      set.add(recipeBase)
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
