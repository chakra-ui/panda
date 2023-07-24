/* eslint-disable */
import type { CssProperty, SystemStyleObject } from './system-types'
import type { TokenCategory } from '../tokens'

type Primitive = string | number | boolean | null | undefined
type LiteralUnion<T, K extends Primitive = string> = T | (K & Record<never, never>)

export type PatternProperty =
  | { type: 'property'; value: CssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: TokenCategory; property?: CssProperty }
  | { type: 'string' | 'boolean' | 'number' }

export type PatternHelpers = {
  map: (value: any, fn: (value: string) => string | undefined) => any
}

export type PatternProperties = Record<string, PatternProperty>

type Props<T> = Record<LiteralUnion<keyof T>, any>

export type PatternConfig<T extends PatternProperties = PatternProperties> = {
  /**
   * The description of the pattern. This will be used in the JSDoc comment.
   */
  description?: string
  /**
   * The JSX element rendered by the pattern
   * @default 'div'
   */
  jsxElement?: string
  /**
   * The properties of the pattern.
   */
  properties?: T
  /**
   * The css object this pattern will generate.
   */
  transform?: (props: Props<T>, helpers: PatternHelpers) => SystemStyleObject
  /**
   * The jsx element name this pattern will generate.
   */
  jsxName?: string
  /**
   * The jsx elements to track for this pattern. Can be string or Regexp.
   *
   * @default capitalize(pattern.name)
   * @example ['Button', 'Link', /Button$/]
   */
  jsx?: Array<string | RegExp>
  /**
   * Whether to only generate types for the specified properties.
   * This will disallow css properties
   */
  strict?: boolean
  /**
   * @experimental
   * Disallow certain css properties for this pattern
   */
  blocklist?: LiteralUnion<CssProperty>[]
}
