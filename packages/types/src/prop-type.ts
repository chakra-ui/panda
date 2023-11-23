import type { ConditionalValue } from './conditions'
import type { CssProperties } from './system-types'

/* -----------------------------------------------------------------------------
 * Shadowed export (in CLI): DO NOT REMOVE
 * -----------------------------------------------------------------------------*/

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PropertyTypes {}

export type PropertyValue<K extends string> = K extends keyof PropertyTypes
  ? ConditionalValue<PropertyTypes[K]>
  : K extends keyof CssProperties
  ? ConditionalValue<CssProperties[K]>
  : never
