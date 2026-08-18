import type { LiteralUnion } from './shared'

export type CssPropertySyntax =
  | '*'
  | '<length>'
  | '<number>'
  | '<percentage>'
  | '<length-percentage>'
  | '<color>'
  | '<image>'
  | '<url>'
  | '<integer>'
  | '<angle>'
  | '<time>'
  | '<resolution>'
  | '<transform-function>'
  | '<length> | <percentage>'

export interface CssPropertyDefinition {
  /**
   * Controls whether the custom property registration specified by @property inherits by default.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@property/inherits
   */
  inherits: boolean
  /**
   * Sets the initial value for the property.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@property/initial-value
   */
  initialValue?: string
  /**
   * Describes the allowable syntax for the property.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@property/syntax
   */
  syntax: LiteralUnion<CssPropertySyntax>
}

export interface GlobalVarsDefinition {
  [key: string]: string | CssPropertyDefinition
}
