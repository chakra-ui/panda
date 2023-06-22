/* eslint-disable */
import type { ConditionalValue, Conditions, Nested } from './conditions'
import type { PropertiesFallback } from './csstype'
import type { SystemProperties, CssVarProperties } from './style-props'

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

export type JsxStyleProps = SystemProperties &
  MinimalNested<SystemStyleObject> & {
    css?: SystemStyleObject
  }

export type Assign<T, U> = Omit<T, keyof U> & U

export type PatchedHTMLProps = {
  htmlSize?: string | number
  htmlWidth?: string | number
  htmlHeight?: string | number
  htmlTranslate?: 'yes' | 'no' | undefined
  htmlContent?: string
}

export type OmittedHTMLProps = 'color' | 'translate' | 'transition' | 'width' | 'height' | 'size' | 'content'

type WithHTMLProps<T> = Omit<T, OmittedHTMLProps> & PatchedHTMLProps

export type JsxHTMLProps<T extends Record<string, any>, P extends Record<string, any> = {}> = Assign<
  WithHTMLProps<T>,
  P
>
