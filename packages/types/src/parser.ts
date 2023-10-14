import type { BoxNodeMap, BoxNodeLiteral, Unboxed, BoxNodeArray } from '@pandacss/extractor'
import type { RawCondition } from './conditions'
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
  collectStyles: () => StylesCollectorType | undefined
  toJSON: () => {
    sva: Array<ResultItem>
    css: Array<ResultItem>
    cva: Array<ResultItem>
    recipe: Record<string, ResultItem[]>
    pattern: Record<string, ResultItem[]>
    jsx: Array<ResultItem>
  }
}

interface StyleEntry {
  prop: string
  value: string
  cond: string
  recipe?: string
  layer?: string
}
interface StyleResultObject {
  [key: string]: any
}

interface ExpandedCondition extends RawCondition {
  params?: string
}
interface AtomicStyleResult {
  result: StyleResultObject[]
  entry: StyleEntry
  hash: string
  conditions?: ExpandedCondition[]
}

export interface StylesCollectorType {
  filePath: string | undefined
  atomic: Set<AtomicStyleResult>
  recipes: Map<string, Set<AtomicStyleResult>>
  recipes_base: Map<string, Set<RecipeBaseResult>>
}

interface GroupedResult {
  result: StyleResultObject
  hashSet: Set<string>
  details: GroupedStyleResultDetails[]
}
interface RecipeBaseResult extends GroupedResult {
  recipe: string
}
interface GroupedStyleResultDetails extends Pick<AtomicStyleResult, 'hash' | 'entry' | 'conditions'> {}
