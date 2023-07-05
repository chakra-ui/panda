import type { SystemStyleObject } from './system-types'

type Pretty<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

export type RecipeVariantRecord = Record<any, Record<any, SystemStyleObject>>

export type RecipeSelection<T extends RecipeVariantRecord, D extends RecipeSelection<T, any> = {}> = D extends Record<
  string,
  unknown
>
  ? { [K in keyof D]?: StringToBoolean<keyof T[K]> } & {
      [K in Exclude<keyof T, keyof D>]-?: StringToBoolean<keyof T[K]>
    }
  : any

export type RecipeVariantFn<T extends RecipeVariantRecord, D extends RecipeSelection<T, any>> = (
  props?: RecipeSelection<T, D>,
) => string

export type RecipeVariantProps<T extends RecipeVariantFn<any, any>> = Pretty<Parameters<T>[0]>

type RecipeVariantMap<T extends RecipeVariantRecord> = {
  [K in keyof T]: Array<keyof T[K]>
}

export type RecipeRuntimeFn<T extends RecipeVariantRecord, D extends RecipeSelection<T, any>> = RecipeVariantFn<
  T,
  D
> & {
  __type: RecipeSelection<T, D>
  variantKeys: (keyof T)[]
  variantMap: RecipeVariantMap<T>
  resolve: (props: RecipeSelection<T, D>) => SystemStyleObject
  config: RecipeConfig<T>
  splitVariantProps<Props extends RecipeSelection<T, D>>(
    props: Props,
  ): [RecipeSelection<T, D>, Pretty<Omit<Props, keyof RecipeVariantRecord>>]
}

export type RecipeCompoundSelection<T extends RecipeVariantRecord> = {
  [K in keyof T]?: StringToBoolean<keyof T[K]> | Array<StringToBoolean<keyof T[K]>>
}

export type RecipeCompoundVariant<T extends RecipeVariantRecord> = RecipeCompoundSelection<T> & {
  css: SystemStyleObject
}

export type RecipeDefinition<T extends RecipeVariantRecord, D extends RecipeSelection<T, any>> = {
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
  defaultVariants?: D
  /**
   * The styles to apply when a combination of variants is selected.
   */
  compoundVariants?: Array<RecipeCompoundVariant<T>>
}

export type RecipeCreatorFn = <T extends RecipeVariantRecord, D extends RecipeSelection<T, any>>(
  config: RecipeDefinition<T, D>,
) => RecipeRuntimeFn<T, D>

export type RecipeConfig<
  T extends RecipeVariantRecord = RecipeVariantRecord,
  D extends RecipeSelection<T, any> = RecipeSelection<T, any>,
> = RecipeDefinition<T, D> & {
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
