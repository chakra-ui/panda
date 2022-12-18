type CssRule = {
  /**
   * The css properties to generate utilities for.
   * @example ['margin', 'padding']
   */
  properties: {
    [property: string]: string[] | boolean
  }
  /**
   * The css conditions to generate utilities for.
   * @example ['hover', 'focus']
   */
  conditions?: string[]
  /**
   * Whether to generate responsive utilities.
   */
  responsive?: boolean
}

type RecipeRule = {
  conditions?: string[]
  responsive?: boolean
} & { [variant: string]: boolean | string[] }

export type StaticCssOptions = {
  /**
   * The css utility classes to generate.
   */
  css?: CssRule[]
  /**
   * The css recipes to generate.
   */
  recipes?: {
    [recipe: string]: RecipeRule[]
  }
}
