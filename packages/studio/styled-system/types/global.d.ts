/* eslint-disable */
// @ts-nocheck
import type { TextStyles, LayerStyles } from '@pandacss/dev'
import type { RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig } from './recipe';
import type { Parts } from './parts';
import type { PatternConfig, PatternProperties } from './pattern';
import type { GlobalStyleObject, SystemStyleObject } from './system-types';
import type { CompositionStyles } from './composition';

declare module '@pandacss/dev' {
  export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): RecipeConfig
  export function defineSlotRecipe<S extends string, V extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, V>): SlotRecipeConfig
  export function defineStyles(definition: SystemStyleObject): SystemStyleObject
  export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject
  export function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles
  export function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles
  export function definePattern<T extends PatternProperties>(config: PatternConfig<T>): PatternConfig
  export function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>
}