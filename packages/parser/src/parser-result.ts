import { type BoxNodeLiteral, type BoxNodeObject } from '@pandacss/extractor'
import { getSlotRecipes, walkObject } from '@pandacss/shared'
import { sortAtRules } from '@pandacss/core'
import type {
  ConditionDetails,
  Dict,
  ParserResultType,
  RecipeConfig,
  RecipeVariantRecord,
  ResultItem,
  SlotRecipeConfig,
} from '@pandacss/types'
import type { ParserOptions } from './parser'
import { isObjectOrArray, traverse } from './traverse'

type StyleValue = BoxNodeLiteral['value']
type StyleResultObject = BoxNodeObject['value']

type StyleEntry = {
  prop: string
  value: StyleValue
  cond: string
  recipe?: string
}
type StyleResult = {
  obj: StyleResultObject
  entry: StyleEntry
  hash: string
}

// TODO get from source package (?)
const isSlotRecipe = (v: RecipeConfig | SlotRecipeConfig): v is SlotRecipeConfig =>
  'slots' in v && Array.isArray(v.slots) && v.slots.length > 0

const hashStyles = (entry: StyleEntry) => {
  let base = `${entry.prop}${ParserResult.separator}value:${entry.value}`
  if (entry.cond) {
    base += `${ParserResult.separator}cond:${entry.cond}`
  }

  if (entry.recipe) {
    base += `${ParserResult.separator}recipe:${entry.recipe}`
  }

  return base
}

export class ParserResult implements ParserResultType {
  static separator = ']___['
  static conditionSeparator = '<|>'

  state: ParserResultType['state'] = 'will-collect'
  /** Ordered list of all ResultItem */
  all = [] as Array<ResultItem>
  jsx = new Set<ResultItem>()
  css = new Set<ResultItem>()
  cva = new Set<ResultItem>()
  sva = new Set<ResultItem>()

  recipe = new Map<string, Set<ResultItem>>()
  pattern = new Map<string, Set<ResultItem>>()

  filePath: string | undefined
  stylesHash = {
    css: new Set<string>(),
    recipe: new Map<string, Set<string>>(),
  }
  shouldHash = true

  filterStyleProps: (props: Dict) => Dict

  constructor(private ctx: ParserResultCtx) {
    this.filterStyleProps =
      ctx.syntax === 'template-literal'
        ? (props: Dict) => props
        : (props: Dict) => filterProps(this.ctx.isValidProperty, props)
  }

  // TODO sort css via condition, media query etc
  private hashStyleProps(set: Set<string>, obj: ResultItem['data'][number], recipe?: string) {
    const isCondition = this.ctx.conditions.isCondition
    // console.log({ obj })

    let isInCondition = false
    let isFinalCondition = false
    let cond = ''
    let prop = ''
    let prevProp = ''
    let prevDepth = 0
    // TODO keep track of main prop ex: <styled.div m={{ base: { p: 4 }}} /> => m

    const normalized = normalizeStyleObject(obj, this.ctx)

    traverse(
      normalized,
      (key, rawValue, path, depth) => {
        if (rawValue === undefined) return

        const value = Array.isArray(rawValue)
          ? toResponsiveObject(rawValue, this.ctx.conditions.breakpoints.keys)
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
            cond = isInCondition && cond ? path.replace(ParserResult.conditionSeparator + prevProp, '') : key
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
          cond = path.split(ParserResult.conditionSeparator).at(-2) ?? ''
          // isInCondition = cond !== ''
          isInCondition = cond !== ''
        }

        let finalCondition = cond
        if (cond) {
          const parts = cond.split(ParserResult.conditionSeparator)
          const first = parts[0]
          // filterBaseConditions
          let relevantParts = parts.filter((p) => p !== 'base')

          if (first && !isCondition(first)) {
            relevantParts = relevantParts.slice(1)
          }

          if (parts.length !== relevantParts.length) {
            finalCondition = relevantParts.join(ParserResult.conditionSeparator)
          }
        }
        const hashed = hashStyles({ prop, value, cond: finalCondition, recipe })
        set.add(hashed)
        // console.log({ prop, value, cond, recipe, isInCondition, prevProp, isFinalCondition, path })
        // console.log({ hashed })

        prevProp = prop
        prevDepth = depth
      },
      { separator: ParserResult.conditionSeparator },
    )
  }

  private processStyleProps(styleObject: StyleResultObject & { css?: StyleResultObject }) {
    const styles = this.filterStyleProps(styleObject)

    if (styles.css) {
      this.hashStyleProps(this.stylesHash.css, styles.css)
    }

    this.hashStyleProps(this.stylesHash.css, styles.css ? Object.assign({}, styles, { css: undefined }) : styles)
  }

  private processRecipe(recipeName: string, variants: RecipeVariantRecord) {
    if (!this.stylesHash.recipe.has(recipeName)) {
      this.stylesHash.recipe.set(recipeName, new Set())
    }

    const set = this.stylesHash.recipe.get(recipeName)!
    this.hashStyleProps(set, variants, recipeName)

    const config = this.ctx.recipes.getConfig(recipeName)
    if (!config) return

    this.processCompoundVariants(config)
  }

  private processPattern(
    patternName: string,
    type: 'pattern' | 'jsx-pattern',
    jsxName: string | undefined,
    patternProps: StyleResultObject,
  ) {
    let fnName = patternName
    if (type === 'jsx-pattern' && jsxName) {
      fnName = this.ctx.patterns.getFnName(jsxName)
    }
    const styleProps = this.ctx.patterns.transform(fnName, patternProps)
    // console.log({ fnName, jsxName, type, patternName, patternProps, styleProps })
    this.processStyleProps(styleProps)
  }

  private processAtomicRecipe(recipe: Pick<RecipeConfig, 'base' | 'variants' | 'compoundVariants'>) {
    const { base = {}, variants = {}, compoundVariants = [] } = recipe
    // console.log({ processAtomicRecipe: true, base })
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

  private processAtomicSlotRecipe(recipe: Pick<SlotRecipeConfig, 'base' | 'variants' | 'compoundVariants'>) {
    const slots = getSlotRecipes(recipe)
    for (const slotRecipe of Object.values(slots)) {
      this.processAtomicRecipe(slotRecipe)
    }
  }

  private processCompoundVariants = (config: RecipeConfig | SlotRecipeConfig) => {
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

  fromHash(hash: string) {
    const [prop, value, condOrRecipe, recipe] = hash.split(ParserResult.separator)
    const entry = {
      prop,
      value: value.replace('value:', ''),
    } as StyleEntry

    // console.log({ prop, value, condOrRecipe, recipe, hash })
    if ((condOrRecipe ?? '').includes('cond:')) {
      entry.cond = condOrRecipe.replace('cond:', '')
    } else if ((condOrRecipe ?? '').includes('recipe:')) {
      entry.recipe = condOrRecipe.replace('recipe:', '')
    }

    if ((recipe ?? '').includes('recipe:')) {
      entry.recipe = recipe.replace('recipe:', '')
    }

    const resolvedValue = entry.value === 'true' ? true : entry.value === 'false' ? false : entry.value
    let obj = { [entry.prop]: resolvedValue }

    let conditions
    if (entry.cond) {
      const parts = entry.cond.split(ParserResult.conditionSeparator)
      conditions = this.ctx.conditions.sort(parts)

      obj = makeObjAt(parts.concat(entry.prop), resolvedValue) as typeof obj
    }

    // console.log(JSON.stringify(obj), { entry, hash })

    return { obj, entry, hash, conditions } as StyleResult
  }

  // TODO sort css based on conditions (sort them first)
  // const order: ConditionType[] = ['self-nesting', 'combinator-nesting', 'parent-nesting', 'at-rule']
  // const styleOrder = [':link', ':visited', ':focus-within', ':focus', ':focus-visible', ':hover', ':active']

  // ask gpt
  /**
   * Collect all styles and recipes
   * and return a new ParserResult (collector, will not hash) with deduplicated ResultItem
   */
  collectStyles() {
    const willHash = this.shouldHash
    this.shouldHash = false

    // console.time('unpack')
    const collector = new ParserResult(this.ctx)

    // const sortedCss = Array.from(this.stylesHash.css).sort((a, b) => {
    //   const aStyles = this.fromHash(a)
    // })

    const cssResults = [] as StyleResult[]
    const recipeResults = [] as StyleResult[]

    this.stylesHash.css.forEach((item) => {
      cssResults.push(this.fromHash(item))
    })
    this.stylesHash.recipe.forEach((set) => {
      set.forEach((item) => {
        recipeResults.push(this.fromHash(item))
      })
    })

    sortStyleRules(cssResults).forEach((styleResult) => {
      // console.log(styleResult.hash)
      collector.set('css', { name: 'css', data: [styleResult.obj] })
    })

    recipeResults.forEach((styleResult) => {
      const recipeName = styleResult.entry.recipe
      if (!recipeName) return

      collector.setRecipe(recipeName, { name: recipeName, data: [styleResult.obj] })
    })

    this.shouldHash = willHash
    collector.state = 'collected'

    // console.log(result)
    // console.timeEnd('unpack')
    return collector
  }

  append(result: ResultItem) {
    this.all.push(result)
    return result
  }

  set(name: 'cva' | 'css' | 'sva', result: ResultItem) {
    this[name].add(this.append(Object.assign({ type: 'object' }, result)))
    if (!this.shouldHash) return

    // TODO seulement faire ce taf si on a besoin de la sérialisation = si watch
    if (name == 'css') {
      result.data.forEach((obj) => this.processStyleProps(obj))
      return
    }

    if (name === 'cva') {
      result.data.forEach(this.processAtomicRecipe.bind(this))
    }

    if (name === 'sva') {
      result.data.forEach(this.processAtomicSlotRecipe.bind(this))
    }
  }

  setCva(result: ResultItem) {
    this.cva.add(this.append(Object.assign({ type: 'cva' }, result)))
    if (!this.shouldHash) return

    result.data.forEach(this.processAtomicRecipe.bind(this))
  }

  setSva(result: ResultItem) {
    this.sva.add(this.append(Object.assign({ type: 'sva' }, result)))
    if (!this.shouldHash) return

    result.data.forEach(this.processAtomicSlotRecipe.bind(this))
  }

  setJsx(result: ResultItem) {
    this.jsx.add(this.append(Object.assign({ type: 'jsx' }, result)))
    if (!this.shouldHash) return

    result.data.forEach((obj) => this.processStyleProps(obj))
  }

  setPattern(name: string, result: ResultItem) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    this.pattern.get(name)?.add(this.append(Object.assign({ type: 'pattern', name }, result)))
    if (!this.shouldHash) return

    result.data.forEach((obj) =>
      this.processPattern(name, (result.type as 'pattern' | undefined) ?? 'pattern', result.name, obj),
    )
  }

  setRecipe(name: string, result: ResultItem) {
    this.recipe.get(name) ?? this.recipe.set(name, new Set())
    this.recipe.get(name)?.add(this.append(Object.assign({ type: 'recipe' }, result)))
    if (!this.shouldHash) return

    const recipeName = name
    const recipes = this.ctx.recipes
    const recipeConfig = recipes.getConfig(recipeName)
    if (!recipeConfig) return

    const recipe = result
    // treat recipe jsx like regular recipe + atomic
    if (result.type) {
      recipe.data.forEach((data) => {
        const [recipeProps, styleProps] = recipes.splitProps(recipeName, data)
        this.processStyleProps(styleProps)
        this.processRecipe(recipeName, recipeProps)
      })
    } else {
      recipe.data.forEach((data) => {
        this.processRecipe(recipeName, data)
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
      this.recipe.get(name) ?? this.recipe.set(name, new Set())
      items.forEach((item) => this.recipe.get(name)?.add(this.append(item)))
    })
    result.pattern.forEach((items, name) => {
      this.pattern.get(name) ?? this.pattern.set(name, new Set())
      items.forEach((item) => this.pattern.get(name)?.add(this.append(item)))
    })

    return this
  }

  mergeStyles(result: ParserResult) {
    result.stylesHash.css.forEach((item) => this.stylesHash.css.add(item))

    result.stylesHash.recipe.forEach((items, name) => {
      this.stylesHash.recipe.get(name) ?? this.stylesHash.recipe.set(name, new Set())
      items.forEach((item) => this.stylesHash.recipe.get(name)?.add(item))
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
}

type ParserResultCtx = ParserOptions

export const createParserResult = (ctx: ParserResultCtx) => new ParserResult(ctx)

const makeObjAt = (path: string[], value: unknown) => {
  if (!path.length) return value as StyleResultObject

  const obj = {} as any
  path.reduce((acc, key, i) => {
    const isLast = i === path.length - 1
    acc[key] = isLast ? value : {}
    return isLast ? obj : acc[key]
  }, obj)

  return obj as StyleResultObject
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

function toResponsiveObject(values: string[], breakpoints: string[]) {
  return values.reduce((acc, current, index) => {
    const key = breakpoints[index]
    if (current != null) {
      acc[key] = current
    }
    return acc
  }, {} as Record<string, string>)
}

function normalizeStyleObject(styles: Record<string, any>, context: ParserResultCtx) {
  const { utility, conditions } = context
  const { hasShorthand, resolveShorthand } = utility

  return walkObject(
    styles,
    (value) => {
      return Array.isArray(value) ? toResponsiveObject(value, conditions!.breakpoints.keys) : value
    },
    {
      stop: (value) => Array.isArray(value),
      getKey: (prop) => {
        return hasShorthand ? resolveShorthand(prop) : prop
      },
    },
  )
}

interface StyleRule extends StyleResult {
  conditions?: Array<ConditionDetails & { params?: string }>
}

// const CONDITION_ORDER: ConditionType[] = ['self-nesting', 'combinator-nesting', 'parent-nesting', 'at-rule']
const hasAtRule = (conditions: ConditionDetails[]) => conditions.some((details) => details.type === 'at-rule')

const styleOrder = [':link', ':visited', ':focus-within', ':focus', ':focus-visible', ':hover', ':active']

const pseudoSelectorScore = (selector: string) => {
  const index = styleOrder.findIndex((pseudoClass) => selector.includes(pseudoClass))
  return index + 1
}

const compareConditions = (a: StyleRule, b: StyleRule) => {
  if (a.conditions!.length === b.conditions!.length) {
    const selector1 = a.conditions![0].value
    const selector2 = b.conditions![0].value
    // console.log({ selector1, selector2 })
    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return a.conditions!.length - b.conditions!.length
}

const compareAtRuleConditions = (a: StyleRule, b: StyleRule) => {
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
    // console.log({ selector1, selector2 })
    return pseudoSelectorScore(selector1) - pseudoSelectorScore(selector2)
  }

  return a.conditions!.length - b.conditions!.length
}

const sortStyleRules = (styleRules: StyleRule[]): StyleRule[] => {
  const sorted: StyleRule[] = []
  const withSelectorsOnly: StyleRule[] = []
  const withAtRules: StyleRule[] = []

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
