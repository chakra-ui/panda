import type { LiteralUnion } from './shared'
import type { NativeCssProperty, SystemStyleObject } from './system-types'
import type { TokenCategory } from './tokens'

export type PatternProperty =
  | { type: 'property'; value: NativeCssProperty }
  | { type: 'enum'; value: string[] }
  | { type: 'token'; value: TokenCategory; property?: NativeCssProperty }
  | { type: 'string' | 'boolean' | 'number' }

export type PatternHelpers = {
  map: (value: any, fn: (value: string) => string | undefined) => any
}

export type PatternConfig = {
  /**
   * The description of the pattern. This will be used in the JSDoc comment.
   */
  description?: string
  /**
   * The JSX element rendered by the pattern
   */
  jsxElement?: string
  /**
   * The properties of the pattern.
   */
  properties: Record<string, PatternProperty>
  /**
   * The css object this pattern will generate.
   */
  transform?: (props: Record<string, any>, helpers: PatternHelpers) => SystemStyleObject
  /**
   * The jsx element name this pattern will generate.
   */
  jsx?: string
  /**
   * Whether to only generate types for the specified properties.
   * This will disallow css properties
   */
  strict?: boolean
  /**
   * @experimental
   * Disallow certain css properties for this pattern
   */
  blocklist?: LiteralUnion<NativeCssProperty>[]
}
