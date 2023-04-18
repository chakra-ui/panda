import type { ParserResult, ResultItem } from '@pandacss/types'

type PartialResult = Pick<ResultItem, 'data' | 'box'>

export const createParserResult = (): ParserResult => ({
  jsx: new Set<ResultItem>(),
  css: new Set<ResultItem>(),
  cva: new Set<ResultItem>(),
  recipe: new Map<string, Set<ResultItem>>(),
  pattern: new Map<string, Set<ResultItem>>(),
  set(name: 'cva' | 'css', result: PartialResult) {
    this[name].add({ type: 'object', ...result })
  },
  setCva(result: PartialResult) {
    this.cva.add({ type: 'cva', ...result })
  },
  setPattern(name: string, result: PartialResult) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    this.pattern.get(name)?.add({ type: 'pattern', name, ...result })
  },
  setRecipe(name: string, result: PartialResult) {
    this.recipe.get(name) ?? this.recipe.set(name, new Set())
    this.recipe.get(name)?.add({ type: 'recipe', ...result })
  },
  isEmpty() {
    return (
      this.css.size === 0 &&
      this.cva.size === 0 &&
      this.recipe.size === 0 &&
      this.pattern.size === 0 &&
      this.jsx.size === 0
    )
  },
  getAll() {
    const result: Array<ResultItem> = []
    this.css.forEach((item) => result.push(item))
    this.cva.forEach((item) => result.push(item))
    this.recipe.forEach((items) => items.forEach((item) => result.push(item)))
    this.pattern.forEach((items) => items.forEach((item) => result.push(item)))
    this.jsx.forEach((item) => result.push(item))
    return result
  },
})
