import { CompositionStyles, AnimationStyles, Config, GlobalFontface, GlobalStyleObject, CssKeyframes, LayerStyles, Parts, SystemStyleObject, PatternConfig, PandaPlugin, Preset, RecipeVariantRecord, RecipeConfig, SemanticTokens, SlotRecipeVariantRecord, SlotRecipeConfig, TextStyles, ThemeVariant, Tokens, PropertyConfig } from '@pandacss/types';
export { Config, Preset, UserConfig } from '@pandacss/types';

declare function defineConfig<const T extends Config>(config: T): T & {
    name: string;
};
declare function defineRecipe<T extends RecipeVariantRecord>(config: RecipeConfig<T>): RecipeConfig<T>;
declare function defineSlotRecipe<S extends string, T extends SlotRecipeVariantRecord<S>>(config: SlotRecipeConfig<S, T>): SlotRecipeConfig<S, T>;
declare function defineParts<T extends Parts>(parts: T): (config: Partial<Record<keyof T, SystemStyleObject>>) => {
    [k: string]: Record<keyof T, SystemStyleObject>[number] | undefined;
};
declare function definePattern<T extends PatternConfig>(config: T): PatternConfig;
declare function definePreset<const T extends Preset>(preset: T): T;
declare function defineKeyframes(keyframes: CssKeyframes): CssKeyframes;
declare function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject;
declare function defineGlobalFontface(definition: GlobalFontface): GlobalFontface;
declare function defineUtility(utility: PropertyConfig): PropertyConfig;
declare function definePlugin(plugin: PandaPlugin): PandaPlugin;
declare function defineThemeVariant<T extends ThemeVariant>(theme: T): T;
declare function defineThemeContract<C extends Partial<Omit<ThemeVariant, 'selector'>>>(_contract: C): <T extends C & ThemeVariant>(theme: T) => T;
declare const defineTokens: {
    <Value>(definition: Value): Value;
} & { [K in keyof Required<Tokens>]: <Value>(definition: Value) => Value; };
declare const defineSemanticTokens: {
    <Value>(definition: Value): Value;
} & { [K in keyof Required<SemanticTokens>]: <Value>(definition: Value) => Value; };
declare function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles;
declare function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles;
declare function defineStyles(definition: SystemStyleObject): SystemStyleObject;
declare function defineAnimationStyles(definition: CompositionStyles['animationStyles']): AnimationStyles;

export { defineAnimationStyles, defineConfig, defineGlobalFontface, defineGlobalStyles, defineKeyframes, defineLayerStyles, defineParts, definePattern, definePlugin, definePreset, defineRecipe, defineSemanticTokens, defineSlotRecipe, defineStyles, defineTextStyles, defineThemeContract, defineThemeVariant, defineTokens, defineUtility };
