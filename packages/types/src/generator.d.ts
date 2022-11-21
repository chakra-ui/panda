interface UtilityProperties {
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
   * The values to generate utilities for.
   * @example ['2', '40px']
   */
  values?: string[]
}

interface RecipeProperties {
  conditions: string[]
  [variant: string]: string[]
}

export type ClassGeneratorOptions = {
  /**
   * The output path for the generated css file.
   */
  outfile?: string
  /**
   * The css utility classes to generate.
   */
  css?: UtilityProperties[]
  /**
   * The css recipes to generate.
   */
  recipes?: {
    [recipe: string]: RecipeProperties[]
  }
}
