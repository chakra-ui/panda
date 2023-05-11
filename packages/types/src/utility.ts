import type { LiteralUnion } from './shared'
import type { CssProperty, NestedCssProperties } from './system-types'
import type { TokenCategory } from '../tokens'

type Getter = (path: string) => any

type ThemeFn = (token: Getter) => Record<string, string>

export type PropertyValues =
  | LiteralUnion<TokenCategory>
  | string[]
  | { type: string }
  | Record<string, string>
  | ThemeFn

export type PropertyTransform = (value: any, token: Getter) => NestedCssProperties | undefined

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
  property?: CssProperty
  /**
   * The shorthand of the property.
   */
  shorthand?: string
}

export type UtilityConfig = {
  [property in LiteralUnion<CssProperty>]?: PropertyConfig
}
