import type { PropertiesFallback } from './csstype'
import type { PropValue } from './prop-type'

type String = string & {}
type Number = number & {}

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

type CssProperties = PropertiesFallback<String | Number>

export type StyleProps = {
  [K in keyof CssProperties]?: PropValue<K>
}
