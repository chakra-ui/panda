import { type BoxNodeObject } from '@pandacss/extractor'
import {
  esc,
  getSlotRecipes,
  isImportant,
  normalizeStyleObject,
  toHash,
  toResponsiveObject,
  withoutImportant,
} from '@pandacss/shared'
import { sortAtRules } from '@pandacss/core'
import type {
  ConditionDetails,
  Dict,
  ParserResultType,
  RawCondition,
  RecipeConfig,
  RecipeVariantRecord,
  ResultItem,
  SlotRecipeConfig,
} from '@pandacss/types'
import type { ParserOptions } from './parser'
import { isObjectOrArray, traverse } from './traverse'

// type StyleValue = BoxNodeLiteral['value']
type StyleResultObject = BoxNodeObject['value']
interface StyleProps extends StyleResultObject {
  css?: StyleResultObject
}

interface StyleEntry {
  prop: string
  value: string
  cond: string
  recipe?: string
  layer?: string
}

interface ExpandedCondition extends RawCondition {
  params?: string
}
interface AtomicStyleResult {
  result: StyleResultObject[]
  entry: StyleEntry
  hash: string
  conditions?: ExpandedCondition[]
}
interface GroupedResult {
  result: StyleResultObject
  hashSet: Set<string>
  details: GroupedStyleResultDetails[]
}
interface RecipeBaseResult extends GroupedResult {
  recipe: string
}
interface GroupedStyleResultDetails extends Pick<AtomicStyleResult, 'hash' | 'entry' | 'conditions'> {}

// TODO get from source package (?)
const isSlotRecipe = (v: RecipeConfig | SlotRecipeConfig): v is SlotRecipeConfig =>
  'slots' in v && Array.isArray(v.slots) && v.slots.length > 0

const hashStyleEntry = (entry: StyleEntry) => {
  let base = `${entry.prop}${HashCollector.separator}value:${entry.value}`
  if (entry.cond) {
    base += `${HashCollector.separator}cond:${entry.cond}`
  }

  if (entry.recipe) {
    base += `${HashCollector.separator}recipe:${entry.recipe}`
  }

  if (entry.layer) {
    base += `${HashCollector.separator}layer:${entry.layer}`
  }

  return base
}

function getOrCreateSet<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey) {
  let set = map.get(key)
  if (!set) {
    map.set(key, new Set<TValue>())
    set = map.get(key)!
  }
  return set as Set<TValue>
}
export class ParserResult implements ParserResultType {
  /** Ordered list of all ResultItem */
  all = [] as Array<ResultItem>
  jsx = new Set<ResultItem>()
  css = new Set<ResultItem>()
  cva = new Set<ResultItem>()
  sva = new Set<ResultItem>()

  recipe = new Map<string, Set<ResultItem>>()
  pattern = new Map<string, Set<ResultItem>>()

  filePath: string | undefined
  hashCollector: HashCollector | undefined

  // TODO seulement faire ce taf si on a besoin de la sérialisation = si watch
  // = shouldHash = false par défaut p'tet mieux ?
  constructor(private context: ParserResultCtx, shouldHash = true) {
    if (shouldHash) {
      this.hashCollector = new HashCollector(context)
    }
  }

  append(result: ResultItem) {
    this.all.push(result)
    return result
  }

  set(name: 'cva' | 'css' | 'sva', result: ResultItem) {
    this[name].add(this.append(Object.assign({ type: 'object' }, result)))
    const hashCollector = this.hashCollector
    if (!hashCollector) return

    if (name == 'css') {
      result.data.forEach((obj) => hashCollector.processStyleProps(obj))
      return
    }

    if (name === 'cva') {
      result.data.forEach(hashCollector.processAtomicRecipe.bind(hashCollector))
      return
    }

    if (name === 'sva') {
      result.data.forEach(hashCollector.processAtomicSlotRecipe.bind(hashCollector))
      return
    }
  }

  setCva(result: ResultItem) {
    this.cva.add(this.append(Object.assign({ type: 'cva' }, result)))
    const hashCollector = this.hashCollector
    if (!hashCollector) return

    result.data.forEach(hashCollector.processAtomicRecipe.bind(hashCollector))
  }

  setSva(result: ResultItem) {
    this.sva.add(this.append(Object.assign({ type: 'sva' }, result)))
    const hashCollector = this.hashCollector
    if (!hashCollector) return

    result.data.forEach(hashCollector.processAtomicSlotRecipe.bind(hashCollector))
  }

  setJsx(result: ResultItem) {
    this.jsx.add(this.append(Object.assign({ type: 'jsx' }, result)))
    const hashCollector = this.hashCollector
    if (!hashCollector) return

    result.data.forEach((obj) => hashCollector.processStyleProps(obj))
  }

  setPattern(name: string, result: ResultItem) {
    const set = getOrCreateSet(this.pattern, name)
    set.add(this.append(Object.assign({ type: 'pattern', name }, result)))

    const hashCollector = this.hashCollector
    if (!hashCollector) return

    result.data.forEach((obj) =>
      hashCollector.processPattern(name, (result.type as 'pattern' | undefined) ?? 'pattern', result.name, obj),
    )
  }

  setRecipe(recipeName: string, result: ResultItem) {
    const set = getOrCreateSet(this.recipe, recipeName)
    set.add(this.append(Object.assign({ type: 'recipe' }, result)))

    const hashCollector = this.hashCollector
    if (!hashCollector) return

    const recipes = this.context.recipes
    const recipeConfig = recipes.getConfig(recipeName)
    if (!recipeConfig) return

    const recipe = result
    // treat recipe jsx like regular recipe + atomic
    if (result.type) {
      recipe.data.forEach((data) => {
        const [recipeProps, styleProps] = recipes.splitProps(recipeName, data)
        hashCollector.processStyleProps(styleProps)
        hashCollector.processRecipe(recipeName, recipeProps)
      })
    } else {
      recipe.data.forEach((data) => {
        hashCollector.processRecipe(recipeName, data)
      })
    }
  }

  isEmpty() {
    return this.all.length === 0
  }

  setFilePath(filePath: string) {
    this.filePath = filePath
    return this
  }

  merge(result: ParserResult) {
    result.css.forEach((item) => this.css.add(this.append(item)))
    result.cva.forEach((item) => this.cva.add(this.append(item)))
    result.sva.forEach((item) => this.sva.add(this.append(item)))
    result.jsx.forEach((item) => this.jsx.add(this.append(item)))

    result.recipe.forEach((items, name) => {
      const set = getOrCreateSet(this.recipe, name)
      items.forEach((item) => set.add(this.append(item)))
    })
    result.pattern.forEach((items, name) => {
      const set = getOrCreateSet(this.pattern, name)
      items.forEach((item) => set.add(this.append(item)))
    })

    return this
  }

  toArray() {
    return this.all
  }

  toJSON() {
    return {
      css: Array.from(this.css),
      cva: Array.from(this.cva),
      sva: Array.from(this.sva),
      jsx: Array.from(this.jsx),
      recipe: Object.fromEntries(Array.from(this.recipe.entries()).map(([key, value]) => [key, Array.from(value)])),
      pattern: Object.fromEntries(Array.from(this.pattern.entries()).map(([key, value]) => [key, Array.from(value)])),
    }
  }

  fromJSON(json: string) {
    const data = JSON.parse(json)

    this.css = new Set(data.css)
    this.cva = new Set(data.cva)
    this.sva = new Set(data.sva)
    this.jsx = new Set(data.jsx)

    this.recipe = new Map(Object.entries(data.recipe))
    this.pattern = new Map(Object.entries(data.pattern))

    return this
  }

  collectStyles() {
    if (!this.hashCollector) return
    if (this.isEmpty()) return

    return new StylesCollector(this.context).setFilePath(this.filePath).collect(this.hashCollector)
  }
}

const identity = (v: any) => v

class HashCollector {
  static separator = ']___['
  static conditionSeparator = '<___>'

  stylesHash = {
    css: new Set<string>(),
    recipe: new Map<string, Set<string>>(),
    recipe_base: new Map<string, Set<string>>(),
    // TODO pattern ?
  }
  private filterStyleProps: (props: Dict) => Dict

  constructor(private context: ParserResultCtx) {
    this.filterStyleProps =
      context.syntax === 'template-literal'
        ? identity
        : (props: Dict) => filterProps(this.context.isValidProperty, props)
  }

  hashStyleObject(set: Set<string>, obj: ResultItem['data'][number], options?: Pick<StyleEntry, 'recipe' | 'layer'>) {
    const isCondition = this.context.conditions.isCondition
    const baseEntry = { recipe: options?.recipe, layer: options?.layer }
    // console.log({ obj })

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
    // TODO keep track of main prop ex: <styled.div m={{ base: { p: 4 }}} /> => m

    const normalized = normalizeStyleObject(obj, this.context)
    // console.log(normalized)

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
          } else {
            cond = isInCondition && cond ? path.replace(HashCollector.conditionSeparator + prevProp, '') : key
            prop = prevProp
            isFinalCondition = true
          }
        }

        if (isObjectOrArray(value)) {
          prevProp = prop
          prevDepth = depth
          return
        }

        if (!isFinalCondition && isInCondition && !path.startsWith(cond)) {
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
        const hashed = hashStyleEntry(Object.assign(baseEntry, { prop, value, cond: finalCondition }))
        set.add(hashed)
        // console.log({ prop, value, cond, options, isInCondition, prevProp, isFinalCondition, path })
        console.log({ hashed })

        prevProp = prop
        prevDepth = depth
      },
      { separator: HashCollector.conditionSeparator },
    )
  }

  processStyleProps(styleProps: StyleProps, options?: Pick<StyleEntry, 'recipe' | 'layer'>) {
    // TODO opt-out from filtering when we come from recipes, cause that's already filtered
    const styles = this.filterStyleProps(styleProps)

    if (styles.css) {
      this.hashStyleObject(this.stylesHash.css, styles.css, options)
    }

    this.hashStyleObject(
      this.stylesHash.css,
      styles.css ? Object.assign({}, styles, { css: undefined }) : styles,
      options,
    )
  }

  processRecipe(recipeName: string, variants: RecipeVariantRecord) {
    const config = this.context.recipes.getConfig(recipeName)
    if (!config) return

    // console.log('processRecpie', { recipeName, variants })
    const set = getOrCreateSet(this.stylesHash.recipe, recipeName)
    // this.hashStyleObject(set, { ...variants, recipeName: '__ignore__' }, recipeName)
    this.hashStyleObject(set, variants, { recipe: recipeName })

    if (config.base) {
      const base_set = getOrCreateSet(this.stylesHash.recipe_base, recipeName)
      this.hashStyleObject(base_set, config.base, { recipe: recipeName })
    }

    // TODO same as config.base
    this.processCompoundVariants(config)
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
    this.processStyleProps(base)
    for (const variant of Object.values(variants)) {
      for (const styles of Object.values(variant)) {
        this.processStyleProps(styles)
      }
    }

    compoundVariants.forEach((compoundVariant) => {
      this.processStyleProps(compoundVariant.css)
    })
  }

  processAtomicSlotRecipe(recipe: Pick<SlotRecipeConfig, 'base' | 'variants' | 'compoundVariants'>) {
    const slots = getSlotRecipes(recipe)
    for (const slotRecipe of Object.values(slots)) {
      this.processAtomicRecipe(slotRecipe)
    }
  }

  processCompoundVariants = (config: RecipeConfig | SlotRecipeConfig) => {
    config.compoundVariants?.forEach((compoundVariant) => {
      if (isSlotRecipe(config)) {
        for (const css of Object.values(compoundVariant.css)) {
          this.processStyleProps(css)
        }
      } else {
        this.processStyleProps(compoundVariant.css)
      }
    })
  }

  merge(result: HashCollector) {
    result.stylesHash.css.forEach((item) => this.stylesHash.css.add(item))

    result.stylesHash.recipe.forEach((items, name) => {
      const set = getOrCreateSet(this.stylesHash.recipe, name)
      items.forEach(set.add)
    })

    return this
  }
}

export class StylesCollector {
  constructor(private context: ParserResultCtx) {}

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

    console.log({ obj, entry, className, transformed })

    // TODO rm array
    return { result: [obj], entry, hash, conditions } as AtomicStyleResult
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
        console.log(obj)
        obj = setValueIn(obj, basePath, transformed.styles)
        console.log(obj)
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

type ParserResultCtx = ParserOptions

export const createParserResult = (ctx: ParserResultCtx) => new ParserResult(ctx)

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
      current[key] = Object.assign(current[key] ?? {}, value)
    } else {
      current = current[key]
    }
  }

  return obj
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

interface StyleRule extends AtomicStyleResult {
  conditions?: Array<ExpandedCondition>
}

const hasAtRule = (conditions: ConditionDetails[]) => conditions.some((details) => details.type === 'at-rule')

const styleOrder = [':link', ':visited', ':focus-within', ':focus', ':focus-visible', ':hover', ':active']
const pseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.includes(pseudoClass))
  return index + 1
}

const compareConditions = (a: WithConditions, b: WithConditions) => {
  if (a.conditions!.length === b.conditions!.length) {
    const selector1 = a.conditions![0].value
    const selector2 = b.conditions![0].value
    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return a.conditions!.length - b.conditions!.length
}

const compareAtRuleConditions = (a: WithConditions, b: WithConditions) => {
  if (a.conditions!.length === b.conditions!.length) {
    // console.log(a.conditions, b.conditions)
    const lastA = a.conditions![a.conditions!.length - 1]
    const lastB = b.conditions![b.conditions!.length - 1]

    const atRule1 = lastA.params ?? lastA.rawValue
    const atRule2 = lastB.params ?? lastB.rawValue

    if (!atRule1 || !atRule2) return 0

    // console.log({ atRule1, atRule2 })

    const score = sortAtRules(atRule1, atRule2)
    if (score !== 0) return score

    const selector1 = a.conditions![0].value
    const selector2 = b.conditions![0].value
    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return a.conditions!.length - b.conditions!.length
}

interface WithConditions extends Pick<StyleRule, 'conditions'> {}

/**
 * Sort style rules by conditions
 * - with no conditions first
 * - with selectors only next
 * - with at-rules last
 *
 * for each of them:
 * - sort by condition length (shorter first)
 * - sort selectors by predefined pseudo selector order
 * - sort at-rules by predefined order (sort-mq postcss plugin order)
 */
const sortStyleRules = <T extends WithConditions>(styleRules: Array<T>): T[] => {
  const sorted: T[] = []
  const withSelectorsOnly: T[] = []
  const withAtRules: T[] = []

  for (const styleRule of styleRules) {
    if (!styleRule.conditions) {
      sorted.push(styleRule)
    } else if (!hasAtRule(styleRule.conditions)) {
      withSelectorsOnly.push(styleRule)
    } else {
      withAtRules.push(styleRule)
    }
  }

  withSelectorsOnly.sort(compareConditions)
  withAtRules.sort(compareAtRuleConditions)

  sorted.push(...withSelectorsOnly, ...withAtRules)

  return sorted
}
