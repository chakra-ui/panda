import { CssProperty } from './panda-csstype'

type PropertyConfig =
  | { type: 'cssProp'; value: CssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: string }
  | { type: 'string' }
  | { type: 'boolean' }

export type Pattern<T extends Record<string, any> = Record<string, any>> = {
  name: string
  properties: Record<string, PropertyConfig>
  transform?: (props: Record<string, any>) => T
}
