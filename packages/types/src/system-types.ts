import type * as CSS from './csstype'

type Loose<T = string> = T & { __type?: never }

type DataAttributes =
  | '[data-selected]'
  | '[data-highlighted]'
  | '[data-hover]'
  | '[data-active]'
  | '[data-checked]'
  | '[data-disabled]'
  | '[data-readonly]'
  | '[data-focus]'
  | '[data-focus-visible]'
  | '[data-invalid]'
  | '[data-pressed]'
  | '[data-expanded]'
  | '[data-grabbed]'
  | '[data-dragged]'
  | '[data-orientation=horizontal]'
  | '[data-orientation=vertical]'
  | '[data-in-range]'
  | '[data-out-of-range]'
  | '[data-placeholder-shown]'
  | `[data-part=${string}']`
  | `[data-attr=${string}']`
  | `[data-placement=${string}']`
  | `[data-theme=${string}']`
  | `[data-size=${string}']`
  | `[data-state=${string}']`
  | '[data-empty]'
  | '[data-loading]'
  | '[data-loaded]'
  | '[data-enter]'
  | '[data-entering]'
  | '[data-exited]'
  | '[data-exiting]'

type Selectors = `&${CSS.SimplePseudos | DataAttributes}` | `${DataAttributes} &`

/**
 * We currently allow group css properties for better maintainability.
 */
type Grouped<T> = {
  selectors?: {
    [key in Selectors | Loose]?: T
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

export type Nested<T> = T & {
  [key in Selectors | Loose]?: Nested<T> | Loose<string | number | boolean>
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

type NestedConditional<C extends TCondition, V> = {
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

type StrictCssProperties<P extends Record<string, any> = NeverType, Strict extends boolean = false> = {
  [Key in NativeCssProperty]?: true extends Strict
    ? EitherOf<Key, NativeCssProperties, P>
    : UnionOf<Key, NativeCssProperties, P>
}

type CustomCssProperties<P extends Record<string, any> = NeverType> = {
  [Key in keyof Omit<P, NativeCssProperty>]?: P[Key]
}

type MixedCssProperties<
  C extends TCondition = TCondition,
  P extends Record<string, any> = NeverType,
  S extends boolean = false,
> = NestedConditional<C, StrictCssProperties<P, S>> &
  NestedConditional<C, CustomCssProperties<P>> & {
    [Key in keyof C]?: MixedCssProperties<Omit<C, Key>, P, S>
  }

export type NestedCssProperties = Nested<CssProperties>

export type StyleObject<
  C extends TCondition = TCondition,
  P extends Record<string, any> = NeverType,
  S extends boolean = false,
> = Nested<MixedCssProperties<C, P, S>> | Grouped<MixedCssProperties<C, P, S>>

export type JSXStyleProperties<
  C extends TCondition = TCondition,
  P extends Record<string, any> = NeverType,
  S extends boolean = false,
> = Nested<MixedCssProperties<C, P, S>> & {
  css?: JSXStyleProperties<C, P, S>
}

export type GlobalStyleObject<
  C extends TCondition = TCondition,
  P extends Record<string, any> = NeverType,
  S extends boolean = false,
> = {
  [selector: string]: Nested<MixedCssProperties<C, P, S>>
}
