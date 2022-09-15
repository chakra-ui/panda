export type BaseConditionType = 'at-rule' | 'parent-nesting' | 'self-nesting'

export type BaseCondition = {
  type: BaseConditionType
  value: string
  [key: string]: string
}

export type RawCondition = BaseCondition & { raw: string }

export type Conditions = {
  [condition: string]: string
}

export type RecursiveCondition<T extends string, C extends string> =
  | T
  | { [K in C]?: RecursiveCondition<T, Exclude<C, K>> }
