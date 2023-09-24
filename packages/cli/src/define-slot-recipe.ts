import merge from 'lodash.merge'
import type {
  RecipeCompoundSelection,
  RecipeCompoundVariant,
  SlotRecipeConfig,
  RecipeSelection,
  SlotRecipeVariantRecord,
  RecipeConfig,
} from '@pandacss/types'
import type { Pretty, DistributivePick, DistributiveOmit } from './utils.types'

export type {
  RecipeCompoundSelection,
  RecipeCompoundVariant,
  SlotRecipeConfig,
  RecipeSelection,
  SlotRecipeVariantRecord,
} from '@pandacss/types'

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

export function defineSlotRecipe<S extends string, T extends SlotRecipeVariantRecord<S>>(
  config: SlotRecipeConfig<S, T>,
): SlotRecipeBuilder<S, T> {
  return Object.assign(
    {
      config: {
        extend: function (variants) {
          return defineSlotRecipe(Object.assign({}, config, merge({ variants: config.variants }, { variants })))
        },
        merge: function (extension) {
          return defineSlotRecipe(merge({}, config, extension))
        },
        pick: function (...keys) {
          return defineSlotRecipe(
            Object.assign({}, config, {
              variants: keys.reduce((acc, key) => ({ ...acc, [key]: config.variants?.[key] }), {}),
              compoundVariants: config.compoundVariants?.filter((compound) => {
                return Object.keys(compound).some((variant) => keys.includes(variant as (typeof keys)[number]))
              }),
            }),
          )
        },
        omit: function (...keys) {
          return defineSlotRecipe(
            Object.assign({}, config, {
              variants: Object.entries(config.variants ?? {}).reduce((acc, [key, value]) => {
                if (keys.includes(key as (typeof keys)[number])) return acc
                return Object.assign({}, acc, { [key]: value })
              }, {}),
              compoundVariants: config.compoundVariants?.filter((compound) => {
                return !Object.keys(compound).some((variant) => keys.includes(variant as (typeof keys)[number]))
              }),
            }),
          )
        },
        cast: function () {
          return config as SlotRecipeConfig<S, SlotRecipeVariantRecord<S>>
        },
        slots: {
          add: function (...slots) {
            return defineSlotRecipe(Object.assign({}, config, { slots: [...(config.slots ?? []), ...slots] }))
          },
          pick: function (...keys) {
            const { slots = [], variants = {}, compoundVariants = [] } = config
            const pickedSlots = slots.filter((slot) => keys.includes(slot as (typeof keys)[number]))
            const pickedVariants: SlotRecipeVariantRecord<S> = {}

            for (const [vName, variantRecord] of Object.entries(variants)) {
              pickedVariants[vName] = {}

              for (const [vKey, bySlots] of Object.entries(variantRecord)) {
                pickedVariants[vName][vKey] = {}

                for (const [vSlot, styles] of Object.entries(bySlots)) {
                  if (keys.includes(vSlot as (typeof keys)[number])) {
                    // @ts-expect-error it's fine
                    pickedVariants[vName][vKey][vSlot] = styles
                  }
                }
              }
            }

            const pickedCompoundVariants = compoundVariants.filter((compound) => {
              return !Object.keys(compound).some((variant) => keys.includes(variant as (typeof keys)[number]))
            })

            return defineSlotRecipe({
              ...config,
              slots: pickedSlots,
              variants: pickedVariants,
              compoundVariants: pickedCompoundVariants,
            })
          },
          omit: function (...keys) {
            const { slots = [], variants = {}, compoundVariants = [] } = config
            const pickedSlots = slots.filter((slot) => !keys.includes(slot as (typeof keys)[number]))
            const pickedVariants: SlotRecipeVariantRecord<S> = {}

            for (const [vName, variantRecord] of Object.entries(variants)) {
              if (!keys.includes(vName as (typeof keys)[number])) {
                pickedVariants[vName] = {}

                for (const [vKey, bySlots] of Object.entries(variantRecord)) {
                  pickedVariants[vName][vKey] = {}

                  for (const [vSlot, styles] of Object.entries(bySlots)) {
                    if (!keys.includes(vSlot as (typeof keys)[number])) {
                      // @ts-expect-error it's fine
                      pickedVariants[vName][vKey][vSlot] = styles
                    }
                  }
                }
              }
            }

            const pickedCompoundVariants = compoundVariants.filter((compound) => {
              return !Object.keys(compound).some((variant) => keys.includes(variant as (typeof keys)[number]))
            })

            return defineSlotRecipe({
              ...config,
              slots: pickedSlots,
              variants: pickedVariants,
              compoundVariants: pickedCompoundVariants,
            })
          },
          assignTo: function <TSlot extends S, TRecipe extends RecipeConfig>(slot: TSlot, recipe: TRecipe) {
            const { variants = {} } = config
            const { variants: recipeVariants = {} } = recipe

            const overridenVariants: SlotRecipeVariantRecord<S> = structuredClone(variants)

            for (const [vName, variantRecord] of Object.entries(variants)) {
              overridenVariants[vName] = {}

              for (const [vKey, bySlots] of Object.entries(variantRecord)) {
                overridenVariants[vName][vKey] = {}

                for (const [vSlot, styles] of Object.entries(bySlots)) {
                  if (vSlot === slot) {
                    // @ts-expect-error it's fine
                    const recipeStyles = recipeVariants[vName]?.[vKey][vSlot]
                    // @ts-expect-error it's fine
                    overridenVariants[vName][vKey][vSlot] = Object.assign({}, styles, recipeStyles)
                  }
                }
              }
            }

            return defineSlotRecipe({ ...config, variants: overridenVariants })
          },
        },
      },
    } as SlotRecipeBuilder<S, T>,
    config,
  ) as SlotRecipeBuilder<S, T>
}
