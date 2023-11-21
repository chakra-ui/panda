/* eslint-disable */
import type {  SystemStyleObject, DistributiveOmit, Pretty  } from './system-types';

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

export type RecipeVariantRecord = Record<any, Record<any, SystemStyleObject>>

export type RecipeSelection<T extends RecipeVariantRecord> = keyof any extends keyof T
  ? {}
  : {
      [K in keyof T]?: StringToBoolean<keyof T[K]>
    }

export type RecipeVariantFn<T extends RecipeVariantRecord> = (props?: RecipeSelection<T>) => string

export type RecipeVariantProps<
  T extends RecipeVariantFn<RecipeVariantRecord> | SlotRecipeVariantFn<string, SlotRecipeVariantRecord<string>>,
> = Pretty<Parameters<T>[0]>

type RecipeVariantMap<T extends RecipeVariantRecord> = {
  [K in keyof T]: Array<keyof T[K]>
}

/* -----------------------------------------------------------------------------
 * Recipe / Standard
 * -----------------------------------------------------------------------------*/

export interface RecipeRuntimeFn<T extends RecipeVariantRecord> extends RecipeVariantFn<T> {
  __type: RecipeSelection<T>
  variantKeys: (keyof T)[]
  variantMap: RecipeVariantMap<T>
  raw: (props?: RecipeSelection<T>) => SystemStyleObject
  config: RecipeConfig<T>
  splitVariantProps<Props extends RecipeSelection<T>>(
    props: Props,
  ): [RecipeSelection<T>, Pretty<DistributiveOmit<Props, keyof T>>]
}

type OneOrMore<T> = T | Array<T>

export type RecipeCompoundSelection<T> = {
  [K in keyof T]?: OneOrMore<StringToBoolean<keyof T[K]>>
}

export type RecipeCompoundVariant<T> = T & {
  css: SystemStyleObject
}

export interface RecipeDefinition<T extends RecipeVariantRecord> {
  /**
   * The base styles of the recipe.
   */
  base?: SystemStyleObject
  /**
   * The multi-variant styles of the recipe.
   */
  variants?: T
  /**
   * The default variants of the recipe.
   */
  defaultVariants?: RecipeSelection<T>
  /**
   * The styles to apply when a combination of variants is selected.
   */
  compoundVariants?: Pretty<RecipeCompoundVariant<RecipeCompoundSelection<T>>>[]
}

export type RecipeCreatorFn = <T extends RecipeVariantRecord>(config: RecipeDefinition<T>) => RecipeRuntimeFn<T>

interface RecipeConfigMeta {
  /**
   * The name of the recipe.
   */
  className: string
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

export interface RecipeConfig<T extends RecipeVariantRecord = RecipeVariantRecord>
  extends RecipeDefinition<T>,
    RecipeConfigMeta {}

/* -----------------------------------------------------------------------------
 * Recipe / Slot
 * -----------------------------------------------------------------------------*/

type SlotRecord<S extends string, T> = Partial<Record<S, T>>

export type SlotRecipeVariantRecord<S extends string> = Record<any, Record<any, SlotRecord<S, SystemStyleObject>>>

export type SlotRecipeVariantFn<S extends string, T extends RecipeVariantRecord> = (
  props?: RecipeSelection<T>,
) => SlotRecord<S, string>

export interface SlotRecipeRuntimeFn<S extends string, T extends SlotRecipeVariantRecord<S>>
  extends SlotRecipeVariantFn<S, T> {
  raw: (props?: RecipeSelection<T>) => Record<S, SystemStyleObject>
  variantKeys: (keyof T)[]
  variantMap: RecipeVariantMap<T>
  splitVariantProps<Props extends RecipeSelection<T>>(props: Props): [RecipeSelection<T>, Pretty<Omit<Props, keyof T>>]
}

export type SlotRecipeCompoundVariant<S extends string, T> = T & {
  css: SlotRecord<S, SystemStyleObject>
}

export interface SlotRecipeDefinition<S extends string, T extends SlotRecipeVariantRecord<S>> {
  /**
   * The parts/slots of the recipe.
   */
  slots: S[] | Readonly<S[]>
  /**
   * The base styles of the recipe.
   */
  base?: SlotRecord<S, SystemStyleObject>
  /**
   * The multi-variant styles of the recipe.
   */
  variants?: T
  /**
   * The default variants of the recipe.
   */
  defaultVariants?: RecipeSelection<T>
  /**
   * The styles to apply when a combination of variants is selected.
   */
  compoundVariants?: Pretty<SlotRecipeCompoundVariant<S, RecipeCompoundSelection<T>>>[]
}

export type SlotRecipeCreatorFn = <S extends string, T extends SlotRecipeVariantRecord<S>>(
  config: SlotRecipeDefinition<S, T>,
) => SlotRecipeRuntimeFn<S, T>

export type SlotRecipeConfig<
  S extends string = string,
  T extends SlotRecipeVariantRecord<S> = SlotRecipeVariantRecord<S>,
> = SlotRecipeDefinition<S, T> & RecipeConfigMeta
