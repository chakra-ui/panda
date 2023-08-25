/* eslint-disable */
// @ts-nocheck
import type { TextStyles, LayerStyles } from '@pandacss/dev'
import type { RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig } from './recipe.d.mts'
import type { Parts } from './parts.d.mts'
import type { PatternConfig, PatternProperties } from './pattern.d.mts'
import type { GlobalStyleObject, SystemStyleObject } from './system-types.d.mts'
import type { CompositionStyles } from './composition.d.mts'

declare module '@pandacss/dev' {
  export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig
  export function defineSlotRecipe<S extends string, V extends SlotRecipeVariantRecord<S>>(
    config: SlotRecipeConfig<S, V>,
  ): SlotRecipeConfig
  export function defineStyles(definition: SystemStyleObject): SystemStyleObject
  export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
  export function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles
  export function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles
  export function definePattern<T extends PatternProperties>(config: PatternConfig<T>): PatternConfig
  export function defineParts<T extends Parts>(
    parts: T,
  ): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>
}
