import type { CssProperty, ConditionCssProperties } from './panda-csstype'

export type PatternProperty =
  | { type: 'cssProp'; value: CssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: string; cssProp?: CssProperty }
  | { type: 'string' | 'boolean' | 'number' }

type Value = string | { [key: string]: Value }

export type TransformHelpers = {
  map: (value: Value, fn: (value: string) => string | undefined) => any
}

export type Pattern = {
  /**
   * The name of the pattern.
   */
  name: string
  /**
   * The properties of the pattern.
   */
  properties: Record<string, PatternProperty>
  /**
   * The css object this pattern will generate.
   */
  transform?: (props: Record<string, Value>, helpers: TransformHelpers) => ConditionCssProperties
}
