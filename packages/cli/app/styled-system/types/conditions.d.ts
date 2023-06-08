import type { AnySelector, Selectors } from './selectors'

export type Conditions = {
	"sm": string
	"smOnly": string
	"smDown": string
	"md": string
	"mdOnly": string
	"mdDown": string
	"lg": string
	"lgOnly": string
	"lgDown": string
	"xl": string
	"xlOnly": string
	"xlDown": string
	"2xl": string
	"2xlOnly": string
	"smToMd": string
	"smToLg": string
	"smToXl": string
	"smTo2xl": string
	"mdToLg": string
	"mdToXl": string
	"mdTo2xl": string
	"lgToXl": string
	"lgTo2xl": string
	"xlTo2xl": string
	"base": string
}

export type Condition = keyof Conditions

export type Conditional<V> =
  | V
  | Array<V | null>
  | {
      [K in keyof Conditions]?: Conditional<V>
    }

export type ConditionalValue<T> = Conditional<T>

export type Nested<P> = P & {
  [K in Selectors]?: Nested<P>
} & {
  [K in AnySelector]?: Nested<P>
} & {
  [K in keyof Conditions]?: Nested<P>
}
