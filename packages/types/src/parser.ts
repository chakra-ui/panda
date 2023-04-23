import type { BoxNodeMap, Unboxed } from '@pandacss/extractor'

export type ResultItem = {
  name?: string
  data: Array<Unboxed['raw']>
  type?: 'object' | 'cva' | 'pattern' | 'recipe' | 'jsx-factory' | 'jsx-pattern' | 'jsx-recipe' | 'jsx'
  box: BoxNodeMap
}

export type ParserResult = {
  jsx: Set<ResultItem>
  css: Set<ResultItem>
  cva: Set<ResultItem>
  recipe: Map<string, Set<ResultItem>>
  pattern: Map<string, Set<ResultItem>>
  set: (name: 'cva' | 'css', result: ResultItem) => void
  setCva: (result: ResultItem) => void
  setJsx: (result: ResultItem) => void
  setRecipe: (name: string, result: ResultItem) => void
  setPattern: (name: string, result: ResultItem) => void
  isEmpty: () => boolean
  getAll: () => Array<ResultItem>
}

export type ExtractedData = {
  name: string
  version: string
  files: string[]
  ast: ResultItem[]
}
