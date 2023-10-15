import { type BoxNodeObject } from '@pandacss/extractor'
import type { RawCondition } from '@pandacss/types'

// type StyleValue = BoxNodeLiteral['value']

export type StyleResultObject = BoxNodeObject['value']
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
