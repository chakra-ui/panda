import type { ParserOptions } from '@pandacss/core'
import { PandaError, getOrCreateSet } from '@pandacss/shared'
import type { ParserResultInterface, ResultItem } from '@pandacss/types'

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]]
  const [first, ...rest] = arrays
  const restProduct = cartesian(rest)
  return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]))
}

export class ParserResult implements ParserResultInterface {
  /** Ordered list of all ResultItem */
  all: ResultItem[] = []
  jsx = new Set<ResultItem>()
  css = new Set<ResultItem>()
  cva = new Set<ResultItem>()
  sva = new Set<ResultItem>()
  token = new Set<ResultItem>()

  recipe = new Map<string, Set<ResultItem>>()
  pattern = new Map<string, Set<ResultItem>>()

  filePath: string | undefined
  encoder: ParserOptions['encoder']

  constructor(
    private context: ParserOptions,
    encoder?: ParserOptions['encoder'],
  ) {
    this.encoder = encoder ?? context.encoder
  }

  append(result: ResultItem) {
    this.all.push(result)
    return result
  }

  set(name: 'cva' | 'css' | 'sva' | 'token', result: ResultItem) {
    switch (name) {
      case 'css':
        this.setCss(result)
        break
      case 'cva':
        this.setCva(result)
        break
      case 'sva':
        this.setSva(result)
        break
      case 'token':
        this.setToken(result)
        break
      default:
        throw new PandaError(
          'UNKNOWN_RESULT_TYPE',
          `Unknown parser result type: "${name}". Expected one of: css, cva, sva, token`,
        )
    }
  }

  setCss(result: ResultItem) {
    this.css.add(this.append(Object.assign({ type: 'css' }, result)))

    const encoder = this.encoder
    const grouped = this.context.config.cssMode === 'grouped'

    if (!grouped || result.data.length <= 1) {
      result.data.forEach((obj) => (grouped ? encoder.processGrouped(obj) : encoder.processAtomic(obj)))
      return
    }

    // Multiple entries in grouped mode (ternaries, css.raw merging):
    // reconstruct the combinations the runtime would evaluate to.
    const keyCounts = new Map<string, number>()
    for (const obj of result.data) {
      for (const key of Object.keys(obj)) {
        keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
      }
    }

    const hasOverlap = Array.from(keyCounts.values()).some((c) => c > 1)

    if (!hasOverlap) {
      // No overlapping keys (css.raw merge): combine all entries into one group
      encoder.processGrouped(Object.assign({}, ...result.data))
      return
    }

    // Overlapping keys (ternary branches): separate base from branches,
    // then generate cartesian product of branch groups merged with base
    const overlappingKeys = new Set<string>()
    keyCounts.forEach((count, key) => {
      if (count > 1) overlappingKeys.add(key)
    })

    const base: Record<string, any> = {}
    const branchEntries: Record<string, any>[] = []

    for (const obj of result.data) {
      if (Object.keys(obj).some((k) => overlappingKeys.has(k))) {
        branchEntries.push(obj)
      } else {
        Object.assign(base, obj)
      }
    }

    // Group branch entries by sorted key set (entries with same keys are alternatives)
    const branchGroups = new Map<string, Record<string, any>[]>()
    for (const entry of branchEntries) {
      const keySet = Object.keys(entry).sort().join('\0')
      const group = branchGroups.get(keySet) || []
      group.push(entry)
      branchGroups.set(keySet, group)
    }

    const groupArrays = Array.from(branchGroups.values())
    const totalCombinations = groupArrays.reduce((acc, g) => acc * g.length, 1)

    if (totalCombinations > 32) {
      result.data.forEach((obj) => encoder.processGrouped(obj))
      return
    }

    for (const combo of cartesian(groupArrays)) {
      encoder.processGrouped(Object.assign({}, base, ...combo))
    }
  }

  setCva(result: ResultItem) {
    this.cva.add(this.append(Object.assign({ type: 'cva' }, result)))

    const encoder = this.encoder
    result.data.forEach((data) => encoder.processAtomicRecipe(data))
  }

  setSva(result: ResultItem) {
    this.sva.add(this.append(Object.assign({ type: 'sva' }, result)))

    const encoder = this.encoder
    result.data.forEach((data) => encoder.processAtomicSlotRecipe(data))
  }

  setToken(result: ResultItem) {
    this.token.add(this.append(Object.assign({ type: 'token' }, result)))
    // Token calls are tracked but don't need encoding like CSS/CVA/SVA
    // They're runtime functions that reference design tokens
  }

  setJsx(result: ResultItem) {
    this.jsx.add(this.append(Object.assign({ type: 'jsx' }, result)))

    const encoder = this.encoder
    const grouped = this.context.config.cssMode === 'grouped'
    result.data.forEach((obj) => encoder.processStyleProps(obj, grouped))
  }

  setPattern(name: string, result: ResultItem) {
    const set = getOrCreateSet(this.pattern, name)
    set.add(this.append(Object.assign({ type: 'pattern', name }, result)))

    const encoder = this.encoder
    result.data.forEach((obj) =>
      encoder.processPattern(name, obj, (result.type as 'pattern' | undefined) ?? 'pattern', result.name),
    )
  }

  setRecipe(recipeName: string, result: ResultItem) {
    const set = getOrCreateSet(this.recipe, recipeName)
    set.add(this.append(Object.assign({ type: 'recipe' }, result)))

    const encoder = this.encoder
    const recipes = this.context.recipes

    const recipeConfig = recipes.getConfig(recipeName)
    if (!recipeConfig) return

    const recipe = result
    // treat recipe jsx like regular recipe + atomic
    if (result.type) {
      recipe.data.forEach((data) => {
        const [recipeProps, styleProps] = recipes.splitProps(recipeName, data)
        encoder.processStyleProps(styleProps)
        encoder.processRecipe(recipeName, recipeProps)
      })
    } else {
      recipe.data.forEach((data) => {
        encoder.processRecipe(recipeName, data)
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
    result.token.forEach((item) => this.token.add(this.append(item)))
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
      token: Array.from(this.token),
      jsx: Array.from(this.jsx),
      recipe: Object.fromEntries(Array.from(this.recipe.entries()).map(([key, value]) => [key, Array.from(value)])),
      pattern: Object.fromEntries(Array.from(this.pattern.entries()).map(([key, value]) => [key, Array.from(value)])),
    }
  }
}
