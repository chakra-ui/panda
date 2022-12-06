import type * as CSS from './csstype'

// type Loose<T = string> = T & { __type?: never }
type LooseAutocomplete<T> = T extends string ? T | Omit<string, T> : T

type NeverType = { __type?: 'never' }

// list of aria states selectors
type AriaAttributes =
  | '[aria-disabled]'
  | '[aria-hidden]'
  | '[aria-invalid]'
  | '[aria-readonly]'
  | '[aria-required]'
  | '[aria-selected]'
  | '[aria-checked]'
  | '[aria-expanded]'
  | '[aria-pressed]'
  | `[aria-current=${'page' | 'step' | 'location' | 'date' | 'time'}]`
  | '[aria-invalid]'
  | `[aria-sort=${'ascending' | 'descending'}]`

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
  | '[data-focus-visible-added]'
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

type AttributeSelector = `&${CSS.Pseudos | DataAttributes | AriaAttributes}`
type ParentSelector = `${DataAttributes} &` | `${AriaAttributes} &`

type Selectors = AttributeSelector | ParentSelector

type ContainerProperties = {
  container?: string
  containerType?: LooseAutocomplete<'size' | 'inline-size'>
  containerName?: string
}

/* -----------------------------------------------------------------------------
 * Native css properties
 * -----------------------------------------------------------------------------*/

type CssVarProperties = {
  [key in `--${string}`]?: string | number
}

export type NativeCssProperties = CSS.Properties & ContainerProperties & CssVarProperties

export type NativeCssProperty = keyof NativeCssProperties

export type CssKeyframes = {
  [time: string]: CssProperties
}

export type CssProperties = NativeCssProperties | Record<string, any>

/* -----------------------------------------------------------------------------
 * Groupings and Conditions
 * -----------------------------------------------------------------------------*/

/**
 * We currently allow group css properties for better maintainability.
 */
type Grouped<T> = {
  selectors?: {
    [key in Selectors]?: T
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
  [key in Selectors]?: Nested<T>
}

/* -----------------------------------------------------------------------------
 * Conditional css properties
 * -----------------------------------------------------------------------------*/

type TCondition = Record<string, string>

export type Conditional<C extends TCondition, V> =
  | V
  | V[] // responsive array
  | {
      [K in keyof C]?: Conditional<C, V>
    }

// type NestedConditional<C extends TCondition, V> = {
//   [K in keyof V]?: Conditional<C, V[K]>
// }

/* -----------------------------------------------------------------------------
 * Mixed css properties (native + conditional + custom properties)
 * -----------------------------------------------------------------------------*/

// type UnionOf<Key extends string, Native extends Record<Key, any>, Custom> = Custom extends NeverType
//   ? Native[Key]
//   : Key extends keyof Custom
//   ? Native[Key] | Custom[Key]
//   : Native[Key]

// type EitherOf<Key extends string, Native extends Record<Key, any>, Custom> = Key extends keyof Custom
//   ? Custom[Key]
//   : Native[Key]

// type StrictCssProperties<P extends Record<string, any> = NeverType, Strict extends boolean = false> = {
//   [Key in NativeCssProperty]?: true extends Strict
//     ? EitherOf<Key, NativeCssProperties, P>
//     : UnionOf<Key, NativeCssProperties, P>
// }

// const tt: CustomCssProperties<{ bg: 'red' | 'blue'; background: 'tim-color' }> = {
//   bg: 'blue',
// }

// type CustomCssProperties<P extends Record<string, any> = NeverType> = {
//   [Key in keyof Omit<P, NativeCssProperty>]?: P[Key]
// }

type MaybeStrictCssProperties<
  Conditions extends TCondition,
  Properties extends Record<string, unknown>,
  StrictMode extends boolean = false,
> = {
  [Key in NativeCssProperty]?: Conditional<
    Conditions,
    true extends StrictMode ? NativeCssProperties[Key] : LooseAutocomplete<NativeCssProperties[Key]>
  >
} & {
  [Key in keyof Properties]?: Conditional<
    Conditions,
    true extends StrictMode ? Properties[Key] : LooseAutocomplete<Properties[Key]>
  >
}

// C - condition record
// P - properties (utilities) background: { token: "colors" } token || tokens + native css + any
// S - strict mode? true or false
type MixedCssProperties<
  Conditions extends TCondition,
  Properties extends Record<string, unknown>,
  StrictMode extends boolean = false,
> = WithConditionalProperties<Conditions, MaybeStrictCssProperties<Conditions, Properties, StrictMode>>

type WithConditionalProperties<
  Conditions extends TCondition,
  Properties extends Record<string, unknown>,
> = Properties & {
  [Key in keyof Conditions]?: WithConditionalProperties<Omit<Conditions, Key>, Properties>
}

// type CustomCssProperties<Conditions extends TCondition, PropertyTypes extends Record<string, unknown>> = {
//   [Key in NativeCssProperty | keyof PropertyTypes]?: Conditional<Conditions, LooseAutocomplete<PropertyTypes[Key]>>
// }

/**
* {
    [Key in keyof C]?: MixedCssProperties<Omit<C, Key>, P, S>
  }
*/

// const tt: CustomCssProperties<
//   { light: string; dark: string },
//   { backgroundColor: 'red.200' | 'red.100'; bg: 'red.200' | 'red.100' }
// > = {
//   bg: { light: 'red.200', dark: '50px' },
// }

/* -----------------------------------------------------------------------------
 * Exported types
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<CssProperties>

export type StyleObject<
  C extends TCondition = TCondition,
  P extends Record<string, unknown> = Record<never, never>,
  S extends boolean = false,
> = Nested<MixedCssProperties<C, P, S>> | Grouped<MixedCssProperties<C, P, S>>

export const tt: MixedCssProperties<{ sm: string; md: string; light: string }, { color: 'red.400' | 'pink.500' }> = {
  color: 'pink.500',
}

export type JSXStyleProperties<
  C extends TCondition = TCondition,
  P extends Record<string, unknown> = Record<never, never>,
  S extends boolean = false,
> = Nested<MixedCssProperties<C, P, S>> & {
  css?: JSXStyleProperties<C, P, S>
}

export type GlobalStyleObject<
  C extends TCondition = TCondition,
  P extends Record<string, string> = Record<never, never>,
  S extends boolean = false,
> = {
  [selector: string]: Nested<MixedCssProperties<C, P, S>>
}

// import { SystemStyleObject, GlobalStyleObject, JSXStyleProps } from ".panda/types"
