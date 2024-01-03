import type { RawCondition } from './conditions'

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

interface ExpandedCondition extends RawCondition {
  params?: string
}

export interface AtomicStyleResult {
  result: StyleResultObject
  entry: StyleEntry
  hash: string
  className: string
  conditions?: ExpandedCondition[]
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

export interface StyleDecoderInterface {
  classNames: Map<string, AtomicStyleResult | RecipeBaseResult>
  //
  results: {
    atomic: Set<AtomicStyleResult>
    recipes: Map<string, Set<AtomicStyleResult>>
    recipes_base: Map<string, Set<RecipeBaseResult>>
  }
  atomic: Set<AtomicStyleResult>
  //
  recipes: Map<string, Set<AtomicStyleResult>>
  recipes_base: Map<string, Set<RecipeBaseResult>>
}
