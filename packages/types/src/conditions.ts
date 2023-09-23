import type { AnySelector, Selectors } from './selectors'

export type ConditionType = 'at-rule' | 'parent-nesting' | 'self-nesting' | 'combinator-nesting'

export interface ConditionDetails {
  type: ConditionType
  value: string
  name?: string
  rawValue?: string
}

export interface RawCondition extends ConditionDetails {
  raw: string
}

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

export interface Conditions {
  [condition: string]: string
}
export interface ExtendableConditions {
  [condition: string]: string | Conditions | undefined
  extend?: Conditions | undefined
}

export type Condition = string

export type Conditional<V> =
  | V
  | Array<V | null>
  | {
      [K in keyof Conditions]?: Conditional<V>
    }

export type ConditionalValue<T> = Conditional<T>

export type Nested<P> =
  | (P & {
      [K in Selectors]?: Nested<P>
    } & {
      [K in AnySelector]?: Nested<P>
    })
  | {
      [K in Condition]?: Nested<P>
    }
