export type BaseConditionType = 'at-rule' | 'parent-selector' | 'pseudo-selector'

type ColorSchemeCondition = {
  type: 'color-scheme'
  value: string
  colorScheme: 'light' | 'dark'
}

type ScreenCondition = {
  type: 'screen'
  value: string
  name?: string
  rawValue: string
}

export type BaseCondition = {
  type: BaseConditionType
  value: string
  [key: string]: string
}

export type Condition = ColorSchemeCondition | ScreenCondition | BaseCondition

export type Conditions = {
  [key: string]: Condition
}

export type RecursiveCondition<T extends string, C extends string> =
  | T
  | { [K in C]?: RecursiveCondition<T, Exclude<C, K>> }
