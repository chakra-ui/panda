import type { ConditionalValue } from './conditions'
import type { PropertiesFallback } from './csstype'
import type { PropertyValue } from './prop-type'

type String = string & {}
type Number = number & {}

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

type CssProperties = PropertiesFallback<String | Number>

export type CssVarProperties = {
  [key in `--${string}`]?: ConditionalValue<string | number>
}

export type SystemProperties = {
  [K in keyof CssProperties]?: PropertyValue<K>
}
