import type { LiteralUnion } from './shared'
import type { NativeCssProperty, NestedCssProperties } from './system-types'

type Getter = (path: string) => any

type ThemeFn = (token: Getter) => Record<string, string>

export type PropertyValues = string | string[] | { type: string } | Record<string, string> | ThemeFn

export type PropertyTransform = (value: any, token: Getter) => NestedCssProperties

export type PropertyConfig = {
  /**
   * @internal
   * The cascade layer to which the property belongs
   */
  layer?: string
  /**
   * The classname this property will generate.
   */
  className?: string
  /**
   * The css style object this property will generate.
   */
  transform?: PropertyTransform
  /**
   * The possible values this property can have.
   */
  values?: PropertyValues
  /**
   * The css property this utility maps to.
   */
  property?: NativeCssProperty
  /**
   * The shorthand of the property.
   */
  shorthand?: string
}

export type UtilityConfig = {
  [property in LiteralUnion<NativeCssProperty>]?: PropertyConfig
}
