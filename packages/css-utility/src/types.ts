import { CSSProperties, CSSProperty, Dict } from '@css-panda/types'

type ClassNameFn = (value: string, prop: string) => string
export type PropertyClassName = string | ClassNameFn

type ValuesFn = (token: (path: string) => any) => Dict<string>

export type PropertyUtility<Tokens extends Dict> = {
  className: PropertyClassName
  transform?: (value: string) => CSSProperties
  values: keyof Tokens | string[] | Dict<string> | ValuesFn
}

export type UtilityConfig<Tokens> = {
  properties: {
    [property in CSSProperty | (string & {})]?: PropertyUtility<Tokens>
  }

  shorthands?: {
    [shorthand: string]: string
  }
}

export type CSSUtilities<Tokens> = Array<UtilityConfig<Tokens>>
