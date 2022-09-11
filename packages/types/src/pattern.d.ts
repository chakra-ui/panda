import type { CssProperty, ConditionCssProperties } from './panda-csstype'

export type PatternProperty =
  | { type: 'cssProp'; value: CssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: string; cssProp?: CssProperty }
  | { type: 'string' | 'boolean' | 'number' }

type Primitive = string
type Value = Primitive | { [key: string]: Value<Primitive> }

export type TransformHelpers = {
  map: (value: Value, fn: (value: Primitive) => string | undefined) => any
}

export type Pattern = {
  name: string
  properties: Record<string, PatternProperty>
  transform?: (props: Record<string, Value>, helpers: TransformHelpers) => ConditionCssProperties
}
