import type { Dict, StringKeyOf } from './shared'

export type ConditionType = 'at-rule' | 'parent-nesting' | 'self-nesting' | 'combinator-nesting'

export type ConditionDetails = {
  type: ConditionType
  value: string
  [key: string]: string
}

export type RawCondition = ConditionDetails & { raw: string }

export type Conditions = {
  [condition: string]: string
}

export type RecursiveCondition<T extends string, C extends string> =
  | T
  | { [K in C]?: RecursiveCondition<T, Exclude<C, K>> }

export type ExtractConditions<Conditions extends Dict, Breakpoints extends Dict> =
  | StringKeyOf<Breakpoints>
  | StringKeyOf<Conditions>
  | 'base'
  | '_'
