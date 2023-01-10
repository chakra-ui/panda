import type { ConditionalValue } from './conditions'
import type { Properties as CSSProperties } from './csstype'

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

export type PropTypes = {}

export type PropValue<K extends string> = K extends keyof PropTypes
  ? ConditionalValue<PropTypes[K]>
  : K extends keyof CSSProperties
  ? ConditionalValue<CSSProperties[K]>
  : never
