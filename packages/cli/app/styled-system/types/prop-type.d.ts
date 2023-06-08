import type { ConditionalValue } from './conditions';
import type { CssProperties } from './system-types'
import type { Tokens } from '../tokens'

type PropertyValueTypes  = {
	borderSlim: Tokens["colors"];
	colorPalette: "rose" | "pink" | "fuchsia" | "purple" | "indigo" | "blue" | "sky" | "cyan" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "gray" | "slate";
	textStyle: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "8xl" | "9xl";
}



  type CssValue<T> = T extends keyof CssProperties ? CssProperties[T] : never

  type Shorthand<T> = T extends keyof PropertyValueTypes ? PropertyValueTypes[T] | CssValue<T> : CssValue<T>

  export type PropertyTypes = PropertyValueTypes & {
  
}

export type PropertyValue<T extends string> = T extends keyof PropertyTypes
  ? ConditionalValue<PropertyTypes[T] | CssValue<T>>
  : T extends keyof CssProperties
  ? ConditionalValue<CssProperties[T]>
  : ConditionalValue<string | number>