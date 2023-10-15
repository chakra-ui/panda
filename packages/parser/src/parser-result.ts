import { getOrCreateSet } from '@pandacss/shared'
import type { ParserResultType, ResultItem, StylesCollectorType } from '@pandacss/types'
import type { ParserOptions } from './parser'

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

  hashCollector: ParserOptions['hashCollector']
  constructor(private context: ParserOptions) {
    this.hashCollector = this.context.hashCollector
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

  mergeStyles(result: ParserResult) {
    result.hashCollector.stylesHash.css.forEach((item) => this.hashCollector.stylesHash.css.add(item))

    result.hashCollector.stylesHash.recipe.forEach((items, name) => {
      this.hashCollector.stylesHash.recipe.get(name) ?? this.hashCollector.stylesHash.recipe.set(name, new Set())
      items.forEach((item) => this.hashCollector.stylesHash.recipe.get(name)?.add(item))
    })

    return this
  }

  collectStyles() {
    if (!this.hashCollector) return
    if (this.isEmpty()) return

    return this.context.stylesCollector.collect(this.hashCollector) as StylesCollectorType
  }
}

export const createParserResult = (ctx: ParserOptions) => new ParserResult(ctx)
