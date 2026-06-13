import type {
  AnimationStyles,
  CompositionStyles,
  Config,
  CssKeyframes,
  GlobalFontface,
  GlobalStyleObject,
  LayerStyles,
  Parts,
  PatternConfig,
  PandaPlugin,
  Preset,
  PropertyConfig,
  RecipeConfig,
  RecipeVariantRecord,
  SemanticTokens,
  SlotRecipeConfig,
  SlotRecipeVariantRecord,
  SystemStyleObject,
  TextStyles,
  ThemeVariant,
  Tokens,
} from '@pandacss/types'

export function defineConfig<const T extends Config>(config: T): T & { name: string } {
  return Object.assign(config, { name: '__panda.config__' })
}

export function defineRecipe<T extends RecipeVariantRecord>(config: RecipeConfig<T>): RecipeConfig<T> {
  return config
}

export function defineSlotRecipe<S extends string, T extends SlotRecipeVariantRecord<S>>(
  config: SlotRecipeConfig<S, T>,
): SlotRecipeConfig<S, T> {
  return config
}

export function defineParts<T extends Parts>(parts: T) {
  return (config: Partial<Record<keyof T, SystemStyleObject>>) =>
    Object.fromEntries(
      Object.entries(config).map(([key, value]) => {
        const part = parts[key as keyof T]
        if (part == null) {
          throw new Error(
            `Part "${key}" does not exist in the anatomy. Available parts: ${Object.keys(parts).join(', ')}`,
          )
        }
        return [part.selector, value]
      }),
    )
}

export function definePattern<T extends PatternConfig>(config: T): PatternConfig {
  return config
}

export function definePreset<const T extends Preset>(preset: T): T {
  return preset
}

export function defineKeyframes(keyframes: CssKeyframes): CssKeyframes {
  return keyframes
}

export function defineGlobalStyles(definition: GlobalStyleObject): GlobalStyleObject {
  return definition
}

export function defineGlobalFontface(definition: GlobalFontface): GlobalFontface {
  return definition
}

export function defineUtility(utility: PropertyConfig): PropertyConfig {
  return utility
}

export function definePlugin(plugin: PandaPlugin): PandaPlugin {
  return plugin
}

export function defineThemeVariant<T extends ThemeVariant>(theme: T): T {
  return theme
}

export function defineThemeContract<C extends Partial<Omit<ThemeVariant, 'selector'>>>(_contract: C) {
  return <T extends C & ThemeVariant>(theme: T): T => defineThemeVariant(theme)
}

function createProxy() {
  const identity = <T>(value: T) => value
  return new Proxy(identity, {
    get() {
      return identity
    },
  })
}

export const defineTokens = createProxy() as {
  <Value>(definition: Value): Value
} & {
  [K in keyof Required<Tokens>]: <Value>(definition: Value) => Value
}

export const defineSemanticTokens = createProxy() as {
  <Value>(definition: Value): Value
} & {
  [K in keyof Required<SemanticTokens>]: <Value>(definition: Value) => Value
}

export function defineTextStyles(definition: CompositionStyles['textStyles']): TextStyles {
  return definition
}

export function defineLayerStyles(definition: CompositionStyles['layerStyles']): LayerStyles {
  return definition
}

export function defineStyles(definition: SystemStyleObject): SystemStyleObject {
  return definition
}

export function defineAnimationStyles(definition: CompositionStyles['animationStyles']): AnimationStyles {
  return definition
}
