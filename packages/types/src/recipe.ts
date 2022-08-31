import { Properties } from './csstype'

export type RecipeVariant = Record<string, Properties>

type TRecipe = Record<string, RecipeVariant>

export type Recipe<Variants extends TRecipe = TRecipe> = {
  name: string
  base?: Properties
  variants?: Variants
  defaultVariants?: {
    [K in keyof Variants]?: keyof Variants[K]
  }
}

export function defineRecipe<Variants extends Record<string, RecipeVariant>>(config: Recipe<Variants>) {
  return config
}
