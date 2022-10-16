import type { CssProperties, WithNesting } from './panda-csstype'

export type RecipeVariant = Record<string, WithNesting<CssProperties>>

type TRecipe = Record<string, RecipeVariant>

export type RecipeConfig<Variants extends TRecipe = TRecipe> = {
  /**
   * The name of the recipe.
   */
  name: string
  /**
   * The base styles of the recipe.
   */
  base?: WithNesting<CssProperties>
  /**
   * The multi-variant styles of the recipe.
   */
  variants?: Variants
  /**
   * The default variants of the recipe.
   */
  defaultVariants?: {
    [K in keyof Variants]?: keyof Variants[K]
  }
  /**
   * The description of the recipe. This will be used in the JSDoc comment.
   */
  description?: string
}
