/* eslint-disable */
import type {  Pretty, DistributiveOmit, DistributivePick  } from './helpers';
import type {  SystemStyleObject  } from './system-types';

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

export type RecipeCompoundSelection<T> = { [K in keyof T]?: OneOrMore<StringToBoolean<keyof T[K]>> }

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
  compoundVariants?: Array<Pretty<RecipeCompoundVariant<RecipeCompoundSelection<T>>>>
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

export interface RecipeBuilderConfig<T extends RecipeVariantRecord> {
  /* Add additional or override variants */
  extend: <TVariants extends RecipeVariantRecord>(variants: TVariants) => RecipeBuilder<Pretty<T & TVariants>>
  /* Deep merge with another recipe */
  merge: <TVariants extends RecipeVariantRecord, MergedVariants extends Pretty<TVariants & T> = Pretty<TVariants & T>>(
    extension: Partial<Omit<RecipeConfig<any>, 'variants' | 'compoundVariants' | 'defaultVariants'>> & {
      variants?: TVariants
      compoundVariants?: Array<Pretty<RecipeCompoundVariant<RecipeCompoundSelection<MergedVariants>>>>
      defaultVariants?: RecipeSelection<MergedVariants>
    },
  ) => RecipeBuilder<MergedVariants>
  /* Pick only specified variants (also filter compoundVariants) */
  pick: <TKeys extends keyof T>(...keys: TKeys[]) => RecipeBuilder<DistributivePick<T, TKeys>>
  /* Omit specified variants (also filter compoundVariants) */
  omit: <TKeys extends keyof T>(...keys: TKeys[]) => RecipeBuilder<DistributiveOmit<T, TKeys>>
  /* Make the recipe generic to simplify the typings */
  cast: () => RecipeConfig<RecipeVariantRecord>
}

export interface RecipeBuilder<T extends RecipeVariantRecord> extends RecipeConfig<T> {
  // config ? build ? api ?
  config: RecipeBuilderConfig<T>
}

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

export type SlotRecipeCompoundVariant<S extends string, T extends RecipeVariantRecord> = RecipeCompoundSelection<T> & {
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
  variants?: T | SlotRecipeVariantRecord<S>
  /**
   * The default variants of the recipe.
   */
  defaultVariants?: RecipeSelection<T>
  /**
   * The styles to apply when a combination of variants is selected.
   */
  compoundVariants?: Array<SlotRecipeCompoundVariant<S, T>>
}

export type SlotRecipeCreatorFn = <S extends string, T extends SlotRecipeVariantRecord<S>>(
  config: SlotRecipeDefinition<S, T>,
) => SlotRecipeRuntimeFn<S, T>

export type SlotRecipeConfig<
  S extends string = string,
  T extends SlotRecipeVariantRecord<S> = SlotRecipeVariantRecord<S>,
> = SlotRecipeDefinition<S, T> & RecipeConfigMeta

export interface SlotRecipeBuilderConfig<S extends string, T extends SlotRecipeVariantRecord<S>> {
  /* Add additional or override variants */
  extend: <TVariants extends SlotRecipeVariantRecord<S>>(
    variants: TVariants,
  ) => SlotRecipeBuilder<S, Pretty<T & TVariants>>
  /* Deep merge with another Slotrecipe */
  merge: <
    TVariants extends SlotRecipeVariantRecord<S>,
    MergedVariants extends Pretty<TVariants & T> = Pretty<TVariants & T>,
  >(
    extension: Partial<Omit<SlotRecipeConfig<any>, 'slots' | 'variants' | 'compoundVariants' | 'defaultVariants'>> & {
      slots?: S[]
      variants?: TVariants extends unknown ? SlotRecipeVariantRecord<S> : TVariants
      compoundVariants?: Array<Pretty<RecipeCompoundVariant<RecipeCompoundSelection<MergedVariants>>>>
      defaultVariants?: RecipeSelection<MergedVariants>
    },
  ) => SlotRecipeBuilder<S, MergedVariants>
  /* Pick only specified variants (also filter compoundVariants) */
  pick: <TKeys extends keyof T>(...keys: TKeys[]) => SlotRecipeBuilder<S, DistributivePick<T, TKeys>>
  /* Omit specified variants (also filter compoundVariants) */
  omit: <TKeys extends keyof T>(...keys: TKeys[]) => SlotRecipeBuilder<S, DistributiveOmit<T, TKeys>>
  /* Make the Slotrecipe generic to simplify the typings */
  cast: () => SlotRecipeConfig<S, SlotRecipeVariantRecord<S>>
  /** Add slots, pick or omit some or assign a config recipe to a slot */
  slots: SlotBuilderConfig<S, T>
}

type PickSlots<S extends string, T extends SlotRecipeVariantRecord<S>, TKeys extends S> = Pretty<{
  [VName in keyof T]: {
    [VKey in keyof T[VName]]: {
      [VSlot in Extract<keyof T[VName][VKey], TKeys>]: T[VName][VKey][VSlot]
    }
  }
}>

type OmitSlots<S extends string, T extends SlotRecipeVariantRecord<S>, TKeys extends S> = Pretty<{
  [VName in keyof T]: {
    [VKey in keyof T[VName]]: {
      [VSlot in Exclude<keyof T[VName][VKey], TKeys>]: T[VName][VKey][VSlot]
    }
  }
}>

export interface SlotBuilderConfig<S extends string, T extends SlotRecipeVariantRecord<S>> {
  /* Add additional slots */
  add: <TSlots extends string>(
    ...slots: TSlots[]
  ) => SlotRecipeBuilder<S | TSlots, T extends SlotRecipeVariantRecord<S | TSlots> ? T : never>
  /* Pick only specified slots (also filter base/variants/compoundVariants) */
  pick: <TKeys extends S>(...keys: TKeys[]) => SlotRecipeBuilder<Extract<S, TKeys>, PickSlots<S, T, TKeys>>
  /* Omit specified slots (also filter base/slots/compoundVariants) */
  omit: <TKeys extends S>(...keys: TKeys[]) => SlotRecipeBuilder<Exclude<S, TKeys>, OmitSlots<S, T, TKeys>>
  /** Assign simple recipe to slot */
  assignTo: <
    TSlot extends S,
    TRecipe extends RecipeConfig,
    TVariants extends NonNullable<TRecipe['variants']> = NonNullable<TRecipe['variants']>,
  >(
    slot: TSlot,
    recipe: TRecipe,
  ) => SlotRecipeBuilder<
    S,
    {
      [VName in keyof T]: {
        [VKey in keyof T[VName]]: {
          [VSlot in keyof T[VName][VKey]]: VSlot extends TSlot
            ? {
                [VRecipeVariant in keyof TVariants]: VRecipeVariant extends VName
                  ? TVariants[VRecipeVariant][VKey]
                  : never
              }[keyof TVariants]
            : T[VName][VKey][VSlot]
        }
      }
    }
  >
}

export interface SlotRecipeBuilder<S extends string, T extends SlotRecipeVariantRecord<S>>
  extends SlotRecipeConfig<S, T> {
  // config ? build ? api ?
  config: SlotRecipeBuilderConfig<S, T>
}
