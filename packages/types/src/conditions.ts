import type { AnySelector, Selectors } from './selectors'

export type ConditionType = 'at-rule' | 'parent-nesting' | 'self-nesting' | 'combinator-nesting' | 'mixed'

export type ConditionDetails = AtRuleCondition | SelectorCondition | MixedCondition

export interface AtRuleCondition {
  type: 'at-rule'
  value: string
  raw: string
  name: string
  params: string
}

export interface SelectorCondition {
  type: 'self-nesting' | 'parent-nesting' | 'combinator-nesting'
  value: string
  raw: string
}

export interface MixedCondition {
  type: 'mixed'
  value: ConditionDetails[]
  raw: string[]
}

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

export type ConditionQuery = string | string[]

export interface Conditions {
  [condition: string]: ConditionQuery
}
export interface ExtendableConditions {
  [condition: string]: ConditionQuery | Conditions | undefined
  extend?: Conditions | undefined
}

export type Condition = string

export type ConditionalValue<V> =
  | V
  | Array<V | null>
  | {
      [K in keyof Conditions]?: ConditionalValue<V>
    }

export type Nested<P> =
  | (P & {
      [K in Selectors]?: Nested<P>
    } & {
      [K in AnySelector]?: Nested<P>
    })
  | {
      [K in Condition]?: Nested<P>
    }
