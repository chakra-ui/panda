export type ConditionType = 'at-rule' | 'parent-selector' | 'pseudo-selector' | 'breakpoint'

export type Condition =
  | {
      type: 'color-scheme'
      value: string
      colorScheme: 'light' | 'dark'
    }
  | {
      type: ConditionType
      value: string
      [key: string]: string
    }

export type Conditions = {
  [key: string]: Condition
}

export type RecursiveCondition<T extends string, C extends string> =
  | T
  | { [K in C]?: RecursiveCondition<T, Exclude<C, K>> }
