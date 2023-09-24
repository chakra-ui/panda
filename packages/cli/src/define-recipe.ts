import merge from 'lodash.merge'
import type {
  RecipeCompoundSelection,
  RecipeCompoundVariant,
  RecipeConfig,
  RecipeSelection,
  RecipeVariantRecord,
} from '@pandacss/types'

export type {
  RecipeCompoundSelection,
  RecipeCompoundVariant,
  RecipeConfig,
  RecipeSelection,
  RecipeVariantRecord,
} from '@pandacss/types'

export interface RecipeBuilderConfig<T extends RecipeVariantRecord> {
  /* Add additional or override variants */
  extend: <TVariants extends RecipeVariantRecord>(variants: TVariants) => RecipeBuilder<Pretty<T & TVariants>>
  /* Deep merge with another recipe */
  merge: <TVariants extends RecipeVariantRecord, MergedVariants extends Pretty<TVariants & T> = Pretty<TVariants & T>>(
    extension: Omit<RecipeConfig<any>, 'variants' | 'compoundVariants' | 'defaultVariants'> & {
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

type Pretty<T> = { [K in keyof T]: T[K] } & {}

/*
  https://dev.to/safareli/pick-omit-and-union-types-in-typescript-4nd9
  */
type Pick_<T, K> = Pick<T, Extract<keyof T, K>>
type Omit_<T, K> = Omit<T, Extract<keyof T, K>>

type DistributivePick<T, K> = T extends unknown
  ? keyof Pick_<T, K> extends never
    ? never
    : { [P in keyof Pick_<T, K>]: Pick_<T, K>[P] }
  : never

type DistributiveOmit<T, K> = T extends unknown
  ? keyof Omit_<T, K> extends never
    ? never
    : { [P in keyof Omit_<T, K>]: Omit_<T, K>[P] }
  : never

export function defineRecipe<T extends RecipeVariantRecord>(config: RecipeConfig<T>): RecipeBuilder<T> {
  return Object.assign(
    {
      config: {
        extend: function (variants) {
          return defineRecipe(Object.assign({}, config, merge({ variants: config.variants }, { variants })))
        },
        merge: function (extension) {
          return defineRecipe(merge({}, config, extension))
        },
        pick: function (...keys) {
          return defineRecipe(
            Object.assign({}, config, {
              variants: keys.reduce((acc, key) => ({ ...acc, [key]: config.variants?.[key] }), {}),
              compoundVariants: config.compoundVariants?.filter((compound) => {
                return Object.keys(compound).some((variant) => keys.includes(variant as (typeof keys)[number]))
              }),
            }),
          )
        },
        omit: function (...keys) {
          return defineRecipe(
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
          return config as RecipeConfig<RecipeVariantRecord>
        },
      },
    } as RecipeBuilder<T>,
    config,
  ) as RecipeBuilder<T>
}
