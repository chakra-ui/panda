/* eslint-disable */
import type {  ConditionalValue, Nested  } from './conditions';
import type {  AtRule, Globals, PropertiesFallback  } from './csstype';
import type {  SystemProperties, CssVarProperties  } from './style-props';

type String = string & {}
type Number = number & {}

export type Pretty<T> = { [K in keyof T]: T[K] } & {}

export type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

export type DistributiveUnion<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] | T[K] : T[K]
} & DistributiveOmit<U, keyof T>

export type Assign<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K]
} & U

/* -----------------------------------------------------------------------------
 * Native css properties
 * -----------------------------------------------------------------------------*/

type DashedIdent = `--${string}`

type StringToMultiple<T extends string> = T | `${T}, ${T}`

export type PositionAreaAxis =
  | 'left'
  | 'center'
  | 'right'
  | 'x-start'
  | 'x-end'
  | 'span-x-start'
  | 'span-x-end'
  | 'x-self-start'
  | 'x-self-end'
  | 'span-x-self-start'
  | 'span-x-self-end'
  | 'span-all'
  | 'top'
  | 'bottom'
  | 'span-top'
  | 'span-bottom'
  | 'y-start'
  | 'y-end'
  | 'span-y-start'
  | 'span-y-end'
  | 'y-self-start'
  | 'y-self-end'
  | 'span-y-self-start'
  | 'span-y-self-end'
  | 'block-start'
  | 'block-end'
  | 'span-block-start'
  | 'span-block-end'
  | 'inline-start'
  | 'inline-end'
  | 'span-inline-start'
  | 'span-inline-end'
  | 'self-block-start'
  | 'self-block-end'
  | 'span-self-block-start'
  | 'span-self-block-end'
  | 'self-inline-start'
  | 'self-inline-end'
  | 'span-self-inline-start'
  | 'span-self-inline-end'
  | 'start'
  | 'end'
  | 'span-start'
  | 'span-end'
  | 'self-start'
  | 'self-end'
  | 'span-self-start'
  | 'span-self-end'

type PositionTry =
  | 'normal'
  | 'flip-block'
  | 'flip-inline'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'block-start'
  | 'block-end'
  | 'inline-start'
  | 'inline-end'
  | DashedIdent

export interface ModernCssProperties {
  /**
   * Defines a name for the anchor element that can be referenced by positioned elements.
   */
  anchorName?: Globals | 'none' | DashedIdent | StringToMultiple<DashedIdent>

  /**
   * Defines the scope of anchor names within the element.
   */
  anchorScope?: Globals | 'none' | 'all' | DashedIdent | StringToMultiple<DashedIdent>

  /**
   * Controls how form elements size themselves.
   */
  fieldSizing?: Globals | 'fixed' | 'content'

  /**
   * Controls whether interpolation of size values should allow keywords.
   */
  interpolateSize?: Globals | 'allow-keywords' | 'numeric-only'

  /**
   * Specifies the anchor element that this positioned element should be positioned relative to.
   */
  positionAnchor?: Globals | 'auto' | DashedIdent

  /**
   * Specifies the area within the anchor element where this positioned element should be placed.
   */
  positionArea?: Globals | 'auto' | PositionAreaAxis | `${PositionAreaAxis} ${PositionAreaAxis}` | String

  /**
   * Specifies the position try options for the element.
   */
  positionTry?: Globals | StringToMultiple<PositionTry> | String

  /**
   * Specifies fallback position try options when the primary position fails.
   */
  positionTryFallback?: Globals | 'none' | StringToMultiple<PositionTry> | String

  /**
   * Specifies the order in which position try options should be attempted.
   */
  positionTryOrder?: Globals | 'normal' | 'most-width' | 'most-height' | 'most-block-size' | 'most-inline-size'

  /**
   * Controls when the positioned element should be visible.
   */
  positionVisibility?: Globals | 'always' | 'anchors-visible' | 'no-overflow'

  /**
   * Controls whether text should wrap or not.
   */
  textWrapMode?: Globals | 'wrap' | 'nowrap'

  /**
   * Controls trimming of spacing in text.
   */
  textSpacingTrim?: Globals | 'normal' | 'space-all' | 'space-first' | 'trim-start'

  /**
   * Controls the style of text wrapping.
   */
  textWrapStyle?: Globals | 'auto' | 'balance' | 'pretty' | 'stable'

  /**
   * Controls whether the entire element should be draggable instead of its contents.
   */
  WebkitUserDrag?: Globals | 'auto' | 'element' | 'none'

  /**
   * Specifies whether an element can be used to drag the entire app window (Electron).
   */
  WebkitAppRegion?: Globals | 'drag' | 'no-drag'

  /**
   * Sets the horizontal spacing between table borders.
   */
  WebkitBorderHorizontalSpacing?: Globals | String | Number

  /**
   * Sets the vertical spacing between table borders.
   */
  WebkitBorderVerticalSpacing?: Globals | String | Number

  /**
   * Controls the display of text content for security purposes (e.g., password fields).
   */
  WebkitTextSecurity?: Globals | 'none' | 'circle' | 'disc' | 'square'
}

export type CssProperty = keyof PropertiesFallback

export interface CssProperties extends PropertiesFallback<String | Number>, CssVarProperties, ModernCssProperties {}

export interface CssKeyframes {
  [name: string]: {
    [time: string]: CssProperties
  }
}

/* -----------------------------------------------------------------------------
 * Conditional css properties
 * -----------------------------------------------------------------------------*/

interface GenericProperties {
  [key: string]: ConditionalValue<String | Number | boolean>
}

/* -----------------------------------------------------------------------------
 * Native css props
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<CssProperties>

export type SystemStyleObject = Omit<Nested<SystemProperties & CssVarProperties>, 'base'>

export interface GlobalStyleObject {
  [selector: string]: SystemStyleObject
}
export interface ExtendableGlobalStyleObject {
  [selector: string]: SystemStyleObject | undefined
  extend?: GlobalStyleObject | undefined
}

/* -----------------------------------------------------------------------------
 * Composition (text styles, layer styles)
 * -----------------------------------------------------------------------------*/

type FilterStyleObject<P extends string> = {
  [K in P]?: K extends keyof SystemStyleObject ? SystemStyleObject[K] : unknown
}

export type CompositionStyleObject<Property extends string> = Nested<FilterStyleObject<Property> & CssVarProperties>

/* -----------------------------------------------------------------------------
 * Font face
 * -----------------------------------------------------------------------------*/

export type GlobalFontfaceRule = Omit<AtRule.FontFaceFallback, 'src'> & Required<Pick<AtRule.FontFaceFallback, 'src'>>

export type FontfaceRule = Omit<GlobalFontfaceRule, 'fontFamily'>

export interface GlobalFontface {
  [name: string]: FontfaceRule | FontfaceRule[]
}

export interface ExtendableGlobalFontface {
  [name: string]: FontfaceRule | FontfaceRule[] | GlobalFontface | undefined
  extend?: GlobalFontface | undefined
}

/* -----------------------------------------------------------------------------
 * Jsx style props
 * -----------------------------------------------------------------------------*/
interface WithCss {
  css?: SystemStyleObject | SystemStyleObject[]
}

export type JsxStyleProps = SystemStyleObject & WithCss

export interface PatchedHTMLProps {
  htmlWidth?: string | number
  htmlHeight?: string | number
  htmlTranslate?: 'yes' | 'no' | undefined
  htmlContent?: string
}

export type OmittedHTMLProps = 'color' | 'translate' | 'transition' | 'width' | 'height' | 'content'

type WithHTMLProps<T> = DistributiveOmit<T, OmittedHTMLProps> & PatchedHTMLProps

export type JsxHTMLProps<T extends Record<string, any>, P extends Record<string, any> = {}> = Assign<
  WithHTMLProps<T>,
  P
>
