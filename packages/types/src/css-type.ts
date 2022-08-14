import type * as CSS from 'csstype'
import type { Loose } from './shared'

type CSSVarFunction = `var(--${string})` | `var(--${string}, ${string | number})`

export type Properties = CSS.PropertiesFallback<number | Loose>

export type CSSProperty = keyof Properties

export type CSSProperties = {
  [Property in keyof Properties]: Properties[Property] | CSSVarFunction
}

export type CSSKeyframes = {
  [time: string]: {
    [T in Loose | 'from' | 'to']?: CSSProperties
  }
}

export type PseudoProperty = `&${CSS.SimplePseudos}`

// type CSSPropertiesAndPseudos = CSSPropertiesWithVars & PseudoProperties

export interface MediaQueries<T> {
  '@media'?: {
    [query: string]: T
  }
}
