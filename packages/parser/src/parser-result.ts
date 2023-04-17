import type { ParserResult, ResultItem } from '@pandacss/types'

type PartialResult = Pick<ResultItem, 'data' | 'box'>

export const createParserResult = (): ParserResult => ({
  all: new Set<ResultItem>(),
  jsx: new Set<ResultItem>(),
  css: new Set<ResultItem>(),
  cva: new Set<ResultItem>(),
  recipe: new Map<string, Set<ResultItem>>(),
  pattern: new Map<string, Set<ResultItem>>(),
  set(name: 'cva' | 'css', result: PartialResult) {
    const obj = { type: 'object', ...result } satisfies ResultItem
    this[name].add(obj)
    this.all.add(obj)
  },
  setCva(result: PartialResult) {
    const cva = { type: 'cva', ...result } satisfies ResultItem
    this.cva.add(cva)
    this.all.add(cva)
  },
  setPattern(name: string, result: PartialResult) {
    this.pattern.get(name) ?? this.pattern.set(name, new Set())
    const pattern = { type: 'pattern', name, ...result } satisfies ResultItem
    this.pattern.get(name)?.add(pattern)
    this.all.add(pattern)
  },
  setRecipe(name: string, result: PartialResult) {
    this.recipe.get(name) ?? this.recipe.set(name, new Set())
    const recipe = { type: 'recipe', ...result } satisfies ResultItem
    this.recipe.get(name)?.add(recipe)
    this.all.add(recipe)
  },
  isEmpty() {
    return this.all.size === 0
  },
})
