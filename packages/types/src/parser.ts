import type { BoxNodeMap, BoxNodeList } from '@pandacss/extractor'

export type ResultItem = {
  name?: string
  data: Record<string, any>
  type?: string
  box?: BoxNodeList | BoxNodeMap
}

export type ParserResult = {
  jsx: Set<ResultItem>
  css: Set<ResultItem>
  cva: Set<ResultItem>
  recipe: Map<string, Set<ResultItem>>
  pattern: Map<string, Set<ResultItem>>
  set: (name: 'cva' | 'css', result: ResultItem) => void
  setCva: (result: ResultItem) => void
  setRecipe: (name: string, result: ResultItem) => void
  setPattern: (name: string, result: ResultItem) => void
  isEmpty: () => boolean
}
