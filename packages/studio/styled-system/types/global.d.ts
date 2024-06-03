// @ts-nocheck
/* eslint-disable */
import type { CompositionStyles } from "./composition.d.ts";
import type { Parts } from "./parts.d.ts";
import type { PatternConfig, PatternProperties } from "./pattern.d.ts";
import type {
  RecipeVariantRecord,
  RecipeConfig,
  SlotRecipeVariantRecord,
  SlotRecipeConfig,
} from "./recipe.d.ts";
import type { GlobalStyleObject, SystemStyleObject } from "./system-types.d.ts";
import type * as Panda from "@pandacss/dev";

declare module "@pandacss/dev" {
  export function defineRecipe<V extends RecipeVariantRecord>(
    config: RecipeConfig<V>,
  ): Panda.RecipeConfig;
  export function defineSlotRecipe<
    S extends string,
    V extends SlotRecipeVariantRecord<S>,
  >(config: SlotRecipeConfig<S, V>): Panda.SlotRecipeConfig;
  export function defineStyles(
    definition: SystemStyleObject,
  ): SystemStyleObject;
  export function defineGlobalStyles(
    definition: GlobalStyleObject,
  ): Panda.GlobalStyleObject;
  export function defineTextStyles(
    definition: CompositionStyles["textStyles"],
  ): Panda.TextStyles;
  export function defineLayerStyles(
    definition: CompositionStyles["layerStyles"],
  ): Panda.LayerStyles;
  export function definePattern<T extends PatternProperties>(
    config: PatternConfig<T>,
  ): Panda.PatternConfig;
  export function defineParts<T extends Parts>(
    parts: T,
  ): (
    config: Partial<Record<keyof T, SystemStyleObject>>,
  ) => Partial<Record<keyof T, SystemStyleObject>>;
}
