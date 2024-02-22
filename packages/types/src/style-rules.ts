import type { ConditionDetails } from './conditions'

export interface StyleResultObject {
  [key: string]: any
}
export interface StyleProps extends StyleResultObject {
  css?: StyleResultObject
}

export interface StyleEntry {
  prop: string
  value: string | number | boolean
  cond: string
  recipe?: string
  slot?: string
  layer?: string
  variants?: boolean
}

export interface AtomicStyleResult {
  result: StyleResultObject
  entry: StyleEntry
  hash: string
  className: string
  conditions?: ConditionDetails[]
  layer?: string
}

export interface GroupedResult extends Pick<AtomicStyleResult, 'result' | 'className'> {
  hashSet: Set<string>
  details: GroupedStyleResultDetails[]
}

export interface RecipeBaseResult extends GroupedResult {
  recipe: string
  slot?: string
}

export interface GroupedStyleResultDetails extends Pick<AtomicStyleResult, 'hash' | 'entry' | 'conditions'> {
  result: StyleResultObject
}
