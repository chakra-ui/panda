import type { ResultItem } from '@pandacss/types'

export class ParserResult {
  jsx = new Set<ResultItem>()
  css = new Set<ResultItem>()
  cva = new Set<ResultItem>()
  sva = new Set<ResultItem>()

  recipe = new Map<string, Set<ResultItem>>()
  pattern = new Map<string, Set<ResultItem>>()

  filePath: string | undefined

  set(name: 'cva' | 'css' | 'sva', result: ResultItem) {
    this[name].add({ type: 'object', ...result })
  }

  setCva(result: ResultItem) {
    this.cva.add({ type: 'cva', ...result })
  }

  setSva(result: ResultItem) {
    this.sva.add({ type: 'sva', ...result })
  }

  setJsx(result: ResultItem) {
    this.jsx.add({ type: 'jsx', ...result })
  }

  setPattern(name: string, result: ResultItem) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    this.pattern.get(name)?.add({ type: 'pattern', name, ...result })
  }

  setRecipe(name: string, result: ResultItem) {
    this.recipe.get(name) ?? this.recipe.set(name, new Set())
    this.recipe.get(name)?.add({ type: 'recipe', ...result })
  }

  isEmpty() {
    return (
      this.css.size === 0 &&
      this.cva.size === 0 &&
      this.sva.size === 0 &&
      this.recipe.size === 0 &&
      this.pattern.size === 0 &&
      this.jsx.size === 0
    )
  }

  setFilePath(filePath: string) {
    this.filePath = filePath
    return this
  }

  toArray() {
    const result: Array<ResultItem> = []
    this.css.forEach((item) => result.push(item))
    this.cva.forEach((item) => result.push(item))
    this.sva.forEach((item) => result.push(item))
    this.jsx.forEach((item) => result.push(item))
    this.recipe.forEach((items) => items.forEach((item) => result.push(item)))
    this.pattern.forEach((items) => items.forEach((item) => result.push(item)))
    return result
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

  merge(result: ParserResult) {
    result.css.forEach((item) => this.css.add(item))
    result.cva.forEach((item) => this.cva.add(item))
    result.sva.forEach((item) => this.sva.add(item))
    result.jsx.forEach((item) => this.jsx.add(item))

    result.recipe.forEach((items, name) => {
      this.recipe.get(name) ?? this.recipe.set(name, new Set())
      items.forEach((item) => this.recipe.get(name)?.add(item))
    })
    result.pattern.forEach((items, name) => {
      this.pattern.get(name) ?? this.pattern.set(name, new Set())
      items.forEach((item) => this.pattern.get(name)?.add(item))
    })

    return this
  }

  static fromJSON(json: string) {
    const data = JSON.parse(json)
    const result = new ParserResult()

    result.css = new Set(data.css)
    result.cva = new Set(data.cva)
    result.sva = new Set(data.sva)
    result.jsx = new Set(data.jsx)

    result.recipe = new Map(Object.entries(data.recipe))
    result.pattern = new Map(Object.entries(data.pattern))

    return result
  }
}

export const createParserResult = () => new ParserResult()
