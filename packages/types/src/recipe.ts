import type { CssProperties, WithNesting } from './panda-csstype'

export type RecipeVariant = Record<string, WithNesting<CssProperties>>

type TRecipe = Record<string, RecipeVariant>

export type Recipe<Variants extends TRecipe = TRecipe> = {
  name: string
  base?: WithNesting<CssProperties>
  variants?: Variants
  defaultVariants?: {
    [K in keyof Variants]?: keyof Variants[K]
  }
}

export function defineRecipe<Variants extends Record<string, RecipeVariant>>(config: Recipe<Variants>) {
  return config
}
