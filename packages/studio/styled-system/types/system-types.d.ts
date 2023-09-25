/* eslint-disable */
import type {  ConditionalValue, Conditions, Nested  } from './conditions';
import type {  PropertiesFallback  } from './csstype';
import type {  SystemProperties, CssVarProperties  } from './style-props';

type String = string & {}
type Number = number & {}

/* -----------------------------------------------------------------------------
 * Native css properties
 * -----------------------------------------------------------------------------*/

export type CssProperty = keyof PropertiesFallback

export type CssProperties = PropertiesFallback<String | Number> & CssVarProperties

export type CssKeyframes = {
  [name: string]: {
    [time: string]: CssProperties
  }
}

/* -----------------------------------------------------------------------------
 * Conditional css properties
 * -----------------------------------------------------------------------------*/

type MinimalNested<P> = {
  [K in keyof Conditions]?: Nested<P>
}

type GenericProperties = {
  [key: string]: ConditionalValue<String | Number | boolean>
}

/* -----------------------------------------------------------------------------
 * Native css props
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<CssProperties>

export type SystemStyleObject = Nested<SystemProperties & CssVarProperties>

export type GlobalStyleObject = {
  [selector: string]: SystemStyleObject
}

export type CompositionStyleObject<Property extends string> = Nested<{
  [K in Property]?: K extends keyof SystemStyleObject ? SystemStyleObject[K] : unknown
}>

/* -----------------------------------------------------------------------------
 * Jsx style props
 * -----------------------------------------------------------------------------*/
type WithCss = { css?: SystemStyleObject }
type StyleProps = SystemProperties & MinimalNested<SystemStyleObject>

export type JsxStyleProps = StyleProps & WithCss

export type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

export type Assign<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K]
} & U

export type PatchedHTMLProps = {
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
