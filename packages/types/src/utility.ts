import type { LiteralUnion } from './shared'
import type { CssProperty, NestedCssProperties } from './system-types'
import type { Token, TokenCategory } from './tokens'

interface TokenFn {
  (path: string): string | undefined
  raw: (path: string) => Token | undefined
}

type ThemeFn = (token: (path: string) => any) => Record<string, string>

export type PropertyValues =
  | LiteralUnion<TokenCategory | 'keyframes'>
  | string[]
  | { type: string }
  | Record<string, string>
  | ThemeFn

export interface ColorMixResult {
  invalid: boolean
  value: string
  color?: string
}

export interface TransformUtils {
  colorMix(value: string): ColorMixResult
}

export interface TransformArgs<T = any> {
  token: TokenFn
  raw: T
  utils: TransformUtils
}

export type PropertyTransform = (value: any, args: TransformArgs) => NestedCssProperties | undefined

export interface PropertyConfig {
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
  shorthand?: string | string[]
  /**
   * The CSS semantic group this property belongs
   */
  group?: CssSemanticGroup
  /**
   * Whether this utility is deprecated or not.
   */
  deprecated?: boolean
}

export type CssSemanticGroup =
  | 'Animation'
  | 'Background Gradient'
  | 'Background'
  | 'Border Radius'
  | 'Border'
  | 'Color'
  | 'Container'
  | 'Display'
  | 'Effect'
  | 'Flex Layout'
  | 'Grid Layout'
  | 'Height'
  | 'Interactivity'
  | 'Layout'
  | 'List'
  | 'Margin'
  | 'Other'
  | 'Padding'
  | 'Position'
  | 'Scroll'
  | 'Shadow'
  | 'System'
  | 'Table'
  | 'Transform'
  | 'Transition'
  | 'Typography'
  | 'Visibility'
  | 'Width'

export type UtilityConfig = {
  [property in LiteralUnion<CssProperty>]?: PropertyConfig
}

type UtilityConfigWithExtend = {
  [pattern in LiteralUnion<CssProperty>]?: PropertyConfig | UtilityConfig | undefined
}

export type ExtendableUtilityConfig = UtilityConfigWithExtend & {
  extend?: UtilityConfig | undefined
}
