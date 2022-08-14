import { CSSProperties, CSSProperty } from '@css-panda/types'

type ClassNameFn = (value: string, prop: string) => string
type ClassName = string | ClassNameFn

type Styles = CSSProperties & {
  [key in `--${string}`]: string | undefined
}

type ValuesFn = (token: (path: string) => any) => Record<string, Styles>

export type PropertyUtility<Tokens> = {
  className: ClassName
  values: keyof Tokens | ValuesFn | Record<string, Styles>
}

export type CSSUtility<Tokens> = {
  properties: {
    [property in CSSProperty | (string & {})]?: PropertyUtility<Tokens>
  }

  shorthands?: {
    [shorthand: string]: string[]
  }
}

export type CSSUtilities<Tokens> = Array<CSSUtility<Tokens>>
