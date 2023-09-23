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

export interface CssProperties extends PropertiesFallback<String | Number>, CssVarProperties {}

export interface CssKeyframes {
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

interface GenericProperties {
  [key: string]: ConditionalValue<String | Number | boolean>
}

/* -----------------------------------------------------------------------------
 * Native css props
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<CssProperties>

export type SystemStyleObject = Nested<SystemProperties & CssVarProperties>

export interface GlobalStyleObject {
  [selector: string]: SystemStyleObject
}
export interface ExtendableGlobalStyleObject {
  [selector: string]: SystemStyleObject | undefined
  extend?: GlobalStyleObject | undefined
}

export type CompositionStyleObject<Property extends string> = Nested<{
  [K in Property]?: K extends keyof SystemStyleObject ? SystemStyleObject[K] : unknown
}>

/* -----------------------------------------------------------------------------
 * Jsx style props
 * -----------------------------------------------------------------------------*/
interface WithCss {
  css?: SystemStyleObject
}
type StyleProps = SystemProperties & MinimalNested<SystemStyleObject>

export type JsxStyleProps = StyleProps & WithCss

export type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

export type Assign<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K]
} & U

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
