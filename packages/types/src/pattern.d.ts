import type { CssProperty } from './panda-csstype'

export type PatternProperty =
  | { type: 'cssProp'; value: CssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: string; cssProp?: CssProperty }
  | { type: 'string' | 'boolean' | 'number' }

export type TransformHelpers = {
  map: (value: any, fn: (value: any) => any) => any
}

export type Pattern<T extends Record<string, any> = Record<string, any>> = {
  name: string
  properties: Record<string, PatternProperty>
  transform?: (props: Record<string, any>, helpers: TransformHelpers) => T
}
