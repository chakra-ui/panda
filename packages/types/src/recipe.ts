import type { SystemStyleObject } from './system-types'

export type RecipeVariant = {
  [variant: string]: SystemStyleObject
}

type TVariants = Record<string, RecipeVariant>

export type RecipeConfig<Variants extends TVariants = TVariants> = {
  /**
   * The name of the recipe.
   */
  name: string
  /**
   * The jsx elements to track for this recipe.
   */
  jsx?: string
  /**
   * The base styles of the recipe.
   */
  base?: SystemStyleObject
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
