import type * as CSS from './csstype'

type Dict<T = unknown> = Record<string, T>

type String = string & {}

type Number = number & {}

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
  | `[data-part=${string}]`
  | `[data-attr=${string}]`
  | `[data-placement=${string}]`
  | `[data-theme=${string}]`
  | `[data-size=${string}]`
  | `[data-state=${string}]`
  | '[data-empty]'
  | '[data-loading]'
  | '[data-loaded]'
  | '[data-enter]'
  | '[data-entering]'
  | '[data-exited]'
  | '[data-exiting]'

type AttributeSelector = `&${CSS.Pseudos | DataAttributes | AriaAttributes}`
type ParentSelector = `${DataAttributes | AriaAttributes} &`
type AnySelector = `${string}&` | `&${string}`

type Selectors = AttributeSelector | ParentSelector

type ContainerProperties = {
  container?: string
  containerType?: 'size' | 'inline-size' | String
  containerName?: string
}

/* -----------------------------------------------------------------------------
 * Native css properties
 * -----------------------------------------------------------------------------*/

type CssVarProperties = {
  [key in `--${string}`]?: string | number
}

export type NativeCssProperties = CSS.PropertiesFallback<String | Number> & ContainerProperties & CssVarProperties

export type NativeCssProperty = keyof NativeCssProperties

export type CssProperties = NativeCssProperties & CssVarProperties

export type CssKeyframes = {
  [name: string]: {
    [time: string]: CssProperties
  }
}

/* -----------------------------------------------------------------------------
 * Conditional css properties
 * -----------------------------------------------------------------------------*/

type Cond = Record<string, string>

export type Conditional<C extends Cond, V> =
  | V
  | Array<V | null>
  | {
      [K in keyof C]?: Conditional<C, V>
    }

/* -----------------------------------------------------------------------------
 * Groupings and Conditions
 * -----------------------------------------------------------------------------*/

/**
 * Group properties for better maintainability
 */
type Grouped<T> = T & {
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

/**
 * Support arbitrary nesting of selectors
 */
type Nested<C extends Cond, P> = P & {
  [K in Selectors | keyof C]?: Nested<C, P>
} & {
  [K in AnySelector]?: Nested<C, P>
}

/* -----------------------------------------------------------------------------
 * Mixed css properties (native + conditional + custom properties)

   C - condition record
   P - custom properties or utilities
   S - strict mode? true or false
 * -----------------------------------------------------------------------------*/

type NativeCssValue<T> = T extends NativeCssProperty ? NativeCssProperties[T] : never

type NativeProperties<Conditions extends Cond, PropTypes extends Dict, Overrides extends Dict> = {
  [K in Exclude<NativeCssProperty, keyof PropTypes | keyof Overrides>]?: Conditional<Conditions, NativeCssProperties[K]>
}

type CustomProperties<
  Conditions extends Cond,
  PropTypes extends Dict,
  StrictMode extends boolean,
  Overrides extends Dict,
> = {
  [K in Exclude<keyof PropTypes, keyof Overrides>]?: Conditional<
    Conditions,
    true extends StrictMode ? PropTypes[K] : PropTypes[K] | NativeCssValue<K>
  >
}

type GenericProperties<Conditions extends Cond> = {
  [key: string]: Conditional<Conditions, boolean | String | Number | undefined>
}

type Css<Conditions extends Cond, PropTypes extends Dict, StrictMode extends boolean, Overrides extends Dict> =
  | (Partial<Overrides> &
      NativeProperties<Conditions, PropTypes, Overrides> &
      CustomProperties<Conditions, PropTypes, StrictMode, Overrides>)
  | GenericProperties<Conditions>

/* -----------------------------------------------------------------------------
 * Exported types
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<{}, CssProperties>

export type StyleObject<
  Conditions extends Cond = {},
  PropTypes extends Dict = {},
  StrictMode extends boolean = false,
  Overrides extends Dict = {},
> = Grouped<Nested<Conditions, Css<Conditions, PropTypes, StrictMode, Overrides>>>

type WithJsxStyleProps<P> = P & {
  css?: P
  sx?: P
}

export type JsxStyleProps<
  Conditions extends Cond = {},
  PropTypes extends Dict = {},
  StrictMode extends boolean = false,
  Overrides extends Dict = {},
> = WithJsxStyleProps<StyleObject<Conditions, PropTypes, StrictMode, Overrides>>

export type GlobalStyleObject<
  Conditions extends Cond = {},
  PropTypes extends Dict = {},
  StrictMode extends boolean = false,
  Overrides extends Dict = {},
> = {
  [selector: string]: StyleObject<Conditions, PropTypes, StrictMode, Overrides>
}

export type CompositionStyleObject<Conditions extends Cond, PropTypes> = Nested<
  Conditions,
  {
    [K in Extract<PropTypes, string>]?: Conditional<
      Conditions,
      K extends NativeCssProperty ? NativeCssProperties[K] : unknown
    >
  }
>
