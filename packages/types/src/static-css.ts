interface CssRule {
  /**
   * The css properties to generate utilities for.
   * @example ['margin', 'padding']
   */
  properties: {
    [property: string]: string[]
  }
  /**
   * The css conditions to generate utilities for.
   * @example ['hover', 'focus']
   */
  conditions?: string[]
}

type RecipeRule =
  | '*'
  | ({
      conditions?: string[]
    } & { [variant: string]: boolean | string[] })

export interface StaticCssOptions {
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
  // TODO patterns
}
