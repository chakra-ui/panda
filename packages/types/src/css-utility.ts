import { CssProperties, CssProperty } from './panda-csstype'

type ClassNameFn = (value: string, prop: string) => string

export type PropertyClassName = string | ClassNameFn

type ValuesFn = (token: (path: string) => any) => Record<string, string>

export type PropertyUtility<T extends Record<string, any>> = {
  className: PropertyClassName
  transform?: (value: string) => CssProperties
  values?: keyof T | string[] | Record<string, string> | ValuesFn
}

export type UtilityConfig<T = Record<string, any>> = {
  properties: {
    [property in CssProperty | (string & {})]?: string | PropertyUtility<T>
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
