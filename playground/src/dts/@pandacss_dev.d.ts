import * as _pandacss_types from '@pandacss/types';
import { Config, RecipeVariantRecord, RecipeConfig, SlotRecipeVariantRecord, SlotRecipeConfig, Parts, SystemStyleObject, PatternConfig, Preset, CssKeyframes, GlobalStyleObject, PropertyConfig, Tokens, SemanticTokens, CompositionStyles, TextStyles, LayerStyles } from '@pandacss/types';
export { CompositionStyles, Config, CssKeyframes, GlobalStyleObject, LayerStyles, PatternConfig, Preset, PropertyConfig, RecipeConfig, RecipeVariantRecord, SemanticTokens, SlotRecipeConfig, SlotRecipeVariantRecord, SystemStyleObject, TextStyles, Tokens } from '@pandacss/types';

declare function defineConfig(config: Config): Config;
declare function defineRecipe<T extends RecipeVariantRecord>(config: RecipeConfig<T>): RecipeConfig;
declare function defineSlotRecipe<S extends string, T extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, T>): SlotRecipeConfig;
declare function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => Partial<Record<keyof T, SystemStyleObject>>;
declare function definePattern<T extends PatternConfig>(config: T): PatternConfig<_pandacss_types.PatternProperties>;
declare function definePreset(preset: Preset): Preset;
declare function defineKeyframes(keyframes: CssKeyframes): CssKeyframes;
declare function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject;
declare function defineUtility(utility: PropertyConfig): PropertyConfig;
type ProxyValue<T> = {
    <Value>(definition: Value extends T ? Value : T): Value;
} & {
    [K in keyof Required<T>]: <Value>(definition: Value extends T[K] ? Value : T[K]) => Value;
};
declare const defineTokens: ProxyValue<Tokens>;
declare const defineSemanticTokens: ProxyValue<SemanticTokens>;
declare function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles;
declare function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles;
declare function defineStyles(definition: SystemStyleObject): SystemStyleObject;

export { defineConfig, defineGlobalStyles, defineKeyframes, defineLayerStyles, defineParts, definePattern, definePreset, defineRecipe, defineSemanticTokens, defineSlotRecipe, defineStyles, defineTextStyles, defineTokens, defineUtility };
