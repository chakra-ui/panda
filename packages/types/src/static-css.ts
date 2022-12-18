interface CssRule {
  /**
   * The css properties to generate utilities for.
   * @example ['margin', 'padding']
   */
  properties: string[]
  /**
   * The css conditions to generate utilities for.
   * @example ['hover', 'focus']
   */
  conditions?: string[]
  /**
   * Whether to generate responsive utilities.
   */
  responsive?: boolean
  /**
   * The values to generate utilities for.
   * @example ['2', '40px']
   * @example "colors"
   */
  values?: string | string[]
}

interface RecipeProperties {
  conditions: string[]
  [variant: string]: string[]
}

export type StaticCssOptions = {
  /**
   * The css utility classes to generate.
   */
  css?: CssRule[]
  /**
   * The css recipes to generate.
   */
  recipes?: {
    [recipe: string]: RecipeProperties[]
  }
}
