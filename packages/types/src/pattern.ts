import type { CssProperty } from './panda-csstype'

type PropertyConfig =
  | { type: 'cssProp'; value: CssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: string; cssProp?: CssProperty }
  | { type: 'string' | 'boolean' | 'number' }

export type TransformHelpers = {
  map: (value: any, fn: (value: any) => any) => any
}

export type Pattern<T extends Record<string, any> = Record<string, any>> = {
  name: string
  properties: Record<string, PropertyConfig>
  transform?: (props: Record<string, any>, helpers: TransformHelpers) => T
}
