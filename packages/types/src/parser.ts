import type { BoxNodeMap, BoxNodeLiteral, Unboxed } from '@pandacss/extractor'

export type ResultItem = {
  name?: string
  data: Array<Unboxed['raw']>
  type?: 'object' | 'cva' | 'pattern' | 'recipe' | 'jsx-factory' | 'jsx-pattern' | 'jsx-recipe' | 'jsx'
  box: BoxNodeMap | BoxNodeLiteral
}

export type ParserResultType = {
  jsx: Set<ResultItem>
  css: Set<ResultItem>
  cva: Set<ResultItem>
  recipe: Map<string, Set<ResultItem>>
  pattern: Map<string, Set<ResultItem>>
  filePath: string | undefined
  set: (name: 'cva' | 'css', result: ResultItem) => void
  setCva: (result: ResultItem) => void
  setJsx: (result: ResultItem) => void
  setRecipe: (name: string, result: ResultItem) => void
  setPattern: (name: string, result: ResultItem) => void
  isEmpty: () => boolean
  setFilePath: (filePath: string) => ParserResultType
  toArray: () => Array<ResultItem>
  toJSON: () => {
    css: Array<ResultItem>
    cva: Array<ResultItem>
    recipe: Record<string, ResultItem[]>
    pattern: Record<string, ResultItem[]>
    jsx: Array<ResultItem>
  }
  merge: (result: ParserResultType) => ParserResultType
}
