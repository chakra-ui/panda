import type { ConditionalValue } from './conditions'
import type { Properties as CSSProperties } from './csstype'

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

export type PropertyTypes = {}

export type PropertyValue<K extends string> = K extends keyof PropertyTypes
  ? ConditionalValue<PropertyTypes[K]>
  : K extends keyof CSSProperties
  ? ConditionalValue<CSSProperties[K]>
  : never
