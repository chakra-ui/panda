import type { RawCondition } from './conditions'

export interface StyleResultObject {
  [key: string]: any
}
export interface StyleProps extends StyleResultObject {
  css?: StyleResultObject
}

export interface StyleEntry {
  prop: string
  value: string
  cond: string
  recipe?: string
  layer?: string
}

interface ExpandedCondition extends RawCondition {
  params?: string
}

export interface AtomicStyleResult {
  result: StyleResultObject
  entry: StyleEntry
  hash: string
  conditions?: ExpandedCondition[]
}

export interface GroupedResult {
  result: StyleResultObject
  hashSet: Set<string>
  details: GroupedStyleResultDetails[]
}

export interface RecipeBaseResult extends GroupedResult {
  recipe: string
}

export interface GroupedStyleResultDetails extends Pick<AtomicStyleResult, 'hash' | 'entry' | 'conditions'> {}

export interface StylesCollectorType {
  filePath: string | undefined
  atomic: Set<AtomicStyleResult>
  recipes: Map<string, Set<AtomicStyleResult>>
  recipes_base: Map<string, Set<RecipeBaseResult>>
}
