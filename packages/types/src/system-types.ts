import type * as CSS from './csstype'

type Loose<T = string> = T & { __type?: never }

/**
 * We currently allow group css properties for better maintainability.
 */
type GroupedCss<T> = {
  selectors?: {
    [key in Pseudo | Loose]?: T
  }
  '@media'?: {
    [query: string]: T
  }
  '@container'?: {
    [query: string]: T
  }
  '@supports'?: {
    [query: string]: T
  }
}

export type NestedCss<T> = T & {
  [key in Pseudo | Loose]?: NestedCss<T> | Loose<string | number | boolean>
}

/* -----------------------------------------------------------------------------
 * Native css properties
 * -----------------------------------------------------------------------------*/

type ContainerProperties = {
  container?: string
  containerType?: 'size' | 'inline-size' | Loose
  containerName?: string
}

export type NativeCssProperties = CSS.PropertiesFallback<Loose<string | number>> & ContainerProperties

export type NativeCssProperty = keyof NativeCssProperties

type Pseudo = `&${CSS.SimplePseudos}`

export type CssProperties = NativeCssProperties & {
  [property: string]: string | number | boolean | Record<string, any> | undefined
}

export type CssKeyframes = {
  [time: string]: CssProperties
}

/* -----------------------------------------------------------------------------
 * Conditional css properties
 * -----------------------------------------------------------------------------*/

type TCondition = Record<string, string>

export type Conditional<C extends TCondition, V> =
  | V
  | {
      [K in keyof C]?: Conditional<C, V>
    }

type WithConditional<C extends TCondition, V> = {
  [K in keyof V]?: Conditional<C, V[K]>
}

type NeverType = { __type?: 'never' }

type UnionOf<Key extends string, Native extends Record<Key, any>, Custom> = Custom extends NeverType
  ? Native[Key]
  : Key extends keyof Custom
  ? Native[Key] | Custom[Key]
  : Native[Key]

type EitherOf<Key extends string, Native extends Record<Key, any>, Custom> = Key extends keyof Custom
  ? Custom[Key]
  : Native[Key]

type StrictCssProperties<CustomProperties extends Record<string, any> = NeverType, Strict extends boolean = false> = {
  [Key in NativeCssProperty]?: true extends Strict
    ? EitherOf<Key, NativeCssProperties, CustomProperties>
    : UnionOf<Key, NativeCssProperties, CustomProperties>
}

type CustomCssProperties<CustomProperties extends Record<string, any> = NeverType> = {
  [Key in keyof Omit<CustomProperties, NativeCssProperty>]?: CustomProperties[Key]
}

type MixedCssProperties<
  Conditions extends TCondition = TCondition,
  CustomProperties extends Record<string, any> = NeverType,
  Strict extends boolean = false,
> = WithConditional<Conditions, StrictCssProperties<CustomCssProperties, Strict>> &
  WithConditional<Conditions, CustomCssProperties<CustomCssProperties>> & {
    [Key in keyof Conditions]?: MixedCssProperties<Omit<Conditions, Key>, CustomProperties, Strict>
  }

export type NestedCssProperties = NestedCss<CssProperties>

export type StyleObject<
  Conditions extends TCondition = TCondition,
  Properties extends Record<string, any> = NeverType,
  Strict extends boolean = false,
> =
  | NestedCss<MixedCssProperties<Conditions, Properties, Strict>>
  | GroupedCss<MixedCssProperties<Conditions, Properties, Strict>>

export type GlobalStyleObject<
  Conditions extends TCondition = TCondition,
  Properties extends Record<string, any> = NeverType,
  Strict extends boolean = false,
> = {
  [selector: string]: NestedCss<MixedCssProperties<Conditions, Properties, Strict>>
}
