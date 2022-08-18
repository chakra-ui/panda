import { CSSProperties, CSSProperty } from './css-type'

type ClassNameFn = (value: string, prop: string) => string

export type PropertyClassName = string | ClassNameFn

type ValuesFn = (token: (path: string) => any) => Record<string, string>

export type PropertyUtility<Tokens extends Record<string, any>> = {
  className: PropertyClassName
  transform?: (value: string) => CSSProperties
  values: keyof Tokens | string[] | Record<string, string> | ValuesFn
}

export type UtilityConfig<Tokens = any> = {
  properties: {
    [property in CSSProperty | (string & {})]?: PropertyUtility<Tokens>
  }

  shorthands?: {
    [shorthand: string]: string
  }
}

export type PluginResult = {
  type: 'object' | 'named-object'
  name?: string
  data: Record<string, any>
}
