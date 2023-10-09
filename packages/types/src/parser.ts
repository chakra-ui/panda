import type { BoxNodeMap, BoxNodeLiteral, Unboxed, BoxNodeArray } from '@pandacss/extractor'
// import type { RecipeConfig, SlotRecipeConfig } from './recipe'

export interface ResultItem {
  name?: string
  data: Array<Unboxed['raw']>
  type?: 'object' | 'cva' | 'sva' | 'pattern' | 'recipe' | 'jsx-factory' | 'jsx-pattern' | 'jsx-recipe' | 'jsx'
  box?: BoxNodeMap | BoxNodeLiteral | BoxNodeArray
}

export interface ParserResultType {
  state: 'will-collect' | 'collected'
  all: Array<ResultItem>
  jsx: Set<ResultItem>
  css: Set<ResultItem>
  cva: Set<ResultItem>
  sva: Set<ResultItem>
  recipe: Map<string, Set<ResultItem>>
  pattern: Map<string, Set<ResultItem>>
  stylesHash: {
    css: Set<string>
    recipe: Map<string, Set<string>>
  }
  filePath: string | undefined
  isEmpty: () => boolean
  toArray: () => Array<ResultItem>
  collectStyles: () => ParserResultType
  toJSON: () => {
    sva: Array<ResultItem>
    css: Array<ResultItem>
    cva: Array<ResultItem>
    recipe: Record<string, ResultItem[]>
    pattern: Record<string, ResultItem[]>
    jsx: Array<ResultItem>
  }
}
