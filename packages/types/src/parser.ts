import type { BoxNodeArray, BoxNodeLiteral, BoxNodeMap, Unboxed } from '@pandacss/extractor'

export interface ResultItem {
  name?: string
  data: Array<Unboxed['raw']>
  type?: 'css' | 'cva' | 'sva' | 'pattern' | 'recipe' | 'jsx-factory' | 'jsx-pattern' | 'jsx-recipe' | 'jsx'
  box?: BoxNodeMap | BoxNodeLiteral | BoxNodeArray
}

export interface ParserResultInterface {
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
}

export interface EncoderJson {
  schemaVersion: string
  styles: {
    atomic?: string[]
    recipes?: {
      [name: string]: string[]
    }
  }
}
