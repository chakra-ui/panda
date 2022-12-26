import type * as CSS from './csstype'

type Dict<T = unknown> = Record<string, T>

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
  containerType?: 'size' | 'inline-size' | (string & {})
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
  [name: string]: {
    [time: string]: CssProperties
  }
}

type CustomCssProperties = {
  [key: string]: string | number | undefined
}

export type CssProperties = NativeCssProperties | CustomCssProperties

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

export type Nested<T> =
  | T
  | {
      [key in Selectors]?: Nested<T>
    }
  | {
      [property: string]: T | Nested<T> | string | number | boolean | null | undefined
    }

/* -----------------------------------------------------------------------------
 * Mixed css properties (native + conditional + custom properties)

   C - condition record
   P - custom properties or utilities
   S - strict mode? true or false
 * -----------------------------------------------------------------------------*/

type Recursive<C extends Cond, P extends Dict> = P & {
  [K in keyof C]?: Recursive<Omit<C, K>, P>
}

type NativeCssValue<T> = T extends NativeCssProperty ? NativeCssProperties[T] : never

type Css<C extends Cond, P extends Dict, S extends boolean> =
  | ({
      [K in Exclude<NativeCssProperty, keyof P>]?: Conditional<C, NativeCssProperties[K]>
    } & {
      [K in keyof P]?: Conditional<C, true extends S ? P[K] : P[K] | NativeCssValue<K>>
    })
  | {
      [key: string]: Conditional<C, string | number | boolean | undefined> | undefined
    }

type RecursiveCss<C extends Cond, P extends Dict, S extends boolean> = Recursive<C, Css<C, P, S>>

/* -----------------------------------------------------------------------------
 * Exported types
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<CssProperties>

export type StyleObject<C extends Cond = Cond, P extends Dict = Record<never, never>, S extends boolean = false> =
  | Nested<RecursiveCss<C, P, S>>
  | Grouped<RecursiveCss<C, P, S>>

export type JsxStyleProps<
  C extends Cond = Cond,
  P extends Dict = Record<never, never>,
  S extends boolean = false,
> = Nested<RecursiveCss<C, P, S>> & {
  css?: StyleObject<C, P, S>
  sx?: StyleObject<C, P, S>
}

export type GlobalStyleObject<
  C extends Cond = Cond,
  P extends Dict = Record<never, never>,
  S extends boolean = false,
> = {
  [selector: string]: Nested<RecursiveCss<C, P, S>>
}
