import type { SystemStyleObject } from './system-types'

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

export type RecipeVariantRecord = Record<string, Record<string, SystemStyleObject>>

export type RecipeSelection<T extends RecipeVariantRecord> = {
  [K in keyof T]?: StringToBoolean<keyof T[K]>
}

export type RecipeVariantFn<T extends RecipeVariantRecord> = (props?: RecipeSelection<T>) => string

export type RecipeVariantProps<T extends RecipeVariantFn<RecipeVariantRecord>> = Parameters<T>[0]

export type RecipeRuntimeFn<T extends RecipeVariantRecord> = RecipeVariantFn<T> & {
  variants: (keyof T)[]
  resolve: (props: RecipeSelection<T>) => SystemStyleObject
  config: RecipeConfig<T>
}

export type RecipeDefinition<T extends RecipeVariantRecord> = {
  /**
   * The base styles of the recipe.
   */
  base?: SystemStyleObject
  /**
   * The multi-variant styles of the recipe.
   */
  variants?: T | RecipeVariantRecord
  /**
   * The default variants of the recipe.
   */
  defaultVariants?: RecipeSelection<T>
}

export type RecipeCreatorFn = <T extends RecipeVariantRecord>(config: RecipeDefinition<T>) => RecipeRuntimeFn<T>

export type RecipeConfig<T extends RecipeVariantRecord = RecipeVariantRecord> = RecipeDefinition<T> & {
  /**
   * The name of the recipe.
   */
  name: string
  /**
   * The description of the recipe. This will be used in the JSDoc comment.
   */
  description?: string
  /**
   * The jsx elements to track for this recipe. Can be string or Regexp.
   *
   * @default capitalize(recipe.name)
   * @example ['Button', 'Link', /Button$/]
   */
  jsx?: Array<string | RegExp>
}
