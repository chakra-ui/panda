import type { Conditional, ConditionalValue, Conditions, Nested } from './conditions'
import type { PropertiesFallback } from './csstype'
import type { StyleProps } from './style-props'

type String = string & {}
type Number = number & {}

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

export type NativeCssProperties = PropertiesFallback<String | Number> & ContainerProperties

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

type MinimalNested<P> = {
  [K in keyof Conditions]?: Nested<P>
}

type GenericProperties = {
  [key: string]: ConditionalValue<unknown>
}

/* -----------------------------------------------------------------------------
 * Native css props
 * -----------------------------------------------------------------------------*/

export type NestedCssProperties = Nested<CssProperties>

export type SystemStyleObject = Nested<StyleProps | GenericProperties>

export type GlobalStyleObject = {
  [selector: string]: SystemStyleObject
}

export type CompositionStyleObject<Property extends string> = Nested<{
  [K in Property]?: Conditional<K extends NativeCssProperty ? NativeCssProperties[K] : unknown>
}>

/* -----------------------------------------------------------------------------
 * Jsx style props
 * -----------------------------------------------------------------------------*/

export type JsxStyleProps = StyleProps &
  MinimalNested<SystemStyleObject> & {
    css?: SystemStyleObject
    sx?: SystemStyleObject
  }
