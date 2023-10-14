import type { BoxNodeMap, BoxNodeLiteral, Unboxed, BoxNodeArray } from '@pandacss/extractor'
// import type { RecipeConfig, SlotRecipeConfig } from './recipe'

export interface ResultItem {
  name?: string
  data: Array<Unboxed['raw']>
  type?: 'object' | 'cva' | 'sva' | 'pattern' | 'recipe' | 'jsx-factory' | 'jsx-pattern' | 'jsx-recipe' | 'jsx'
  box?: BoxNodeMap | BoxNodeLiteral | BoxNodeArray
}

export interface ParserResultType {
  all: Array<ResultItem>
  jsx: Set<ResultItem>
  css: Set<ResultItem>
  cva: Set<ResultItem>
  sva: Set<ResultItem>
  recipe: Map<string, Set<ResultItem>>
  pattern: Map<string, Set<ResultItem>>
  filePath: string | undefined
  isEmpty: () => boolean
  toArray: () => Array<ResultItem>
  collectStyles: () => StyleCollectorType | undefined
  toJSON: () => {
    sva: Array<ResultItem>
    css: Array<ResultItem>
    cva: Array<ResultItem>
    recipe: Record<string, ResultItem[]>
    pattern: Record<string, ResultItem[]>
    jsx: Array<ResultItem>
  }
}

type StyleEntry = {
  prop: string
  value: string
  cond: string
  recipe?: string
  layer?: string
}
type StyleResult = {
  result: any[] // TODO
  entry: StyleEntry
  hash: string
}

export interface StyleCollectorType {
  filePath: string | undefined
  atomic: Set<StyleResult>
  recipes: Map<string, Set<StyleResult>>
}
