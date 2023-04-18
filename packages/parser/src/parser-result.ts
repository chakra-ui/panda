import type { ParserResult, ResultItem } from '@pandacss/types'

export const createParserResult = (): ParserResult => ({
  jsx: new Set<ResultItem>(),
  css: new Set<ResultItem>(),
  cva: new Set<ResultItem>(),
  recipe: new Map<string, Set<ResultItem>>(),
  pattern: new Map<string, Set<ResultItem>>(),
  set(name: 'cva' | 'css', result: ResultItem) {
    this[name].add({ type: 'object', ...result })
  },
  setCva(result: ResultItem) {
    this.cva.add({ type: 'cva', ...result })
  },
  setJsx(result: ResultItem) {
    this.jsx.add({ type: 'jsx', ...result })
  },
  setPattern(name: string, result: ResultItem) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    this.pattern.get(name)?.add({ type: 'pattern', name, ...result })
  },
  setRecipe(name: string, result: ResultItem) {
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
