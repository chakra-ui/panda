import type {
  HooksApiInterface,
  CompositionStyles,
  Config,
  CssKeyframes,
  GlobalStyleObject,
  LayerStyles,
  Parts,
  PatternConfig,
  Preset,
  PropertyConfig,
  RecipeConfig,
  RecipeVariantRecord,
  SemanticTokens,
  SlotRecipeConfig,
  SlotRecipeVariantRecord,
  SystemStyleObject,
  TextStyles,
  Tokens,
  PandaPlugin,
} from '@pandacss/types'

/* -----------------------------------------------------------------------------
 * Config creators
 * -----------------------------------------------------------------------------*/

export function defineConfig(config: Config) {
  return config
}

export function defineRecipe<T extends RecipeVariantRecord>(config: RecipeConfig<T>): RecipeConfig {
  return config as RecipeConfig
}

export function defineSlotRecipe<S extends string, T extends SlotRecipeVariantRecord<S>>(
  config: SlotRecipeConfig<S, T>,
) {
  return config as SlotRecipeConfig
}

export function defineParts<T extends Parts>(parts: T) {
  return function (config: Partial<Record<keyof T, SystemStyleObject>>): Partial<Record<keyof T, SystemStyleObject>> {
    return Object.fromEntries(
      Object.entries(config).map(([key, value]) => {
        const part = parts[key]
        if (part == null) {
          throw new Error(
            `Part "${key}" does not exist in the anatomy. Available parts: ${Object.keys(parts).join(', ')}`,
          )
        }
        return [part.selector, value]
      }),
    ) as any
  }
}

export function definePattern<T extends PatternConfig>(config: T) {
  return config as PatternConfig
}

export function definePreset(preset: Preset): Preset {
  return preset
}

export function defineKeyframes(keyframes: CssKeyframes) {
  return keyframes
}

export function defineGlobalStyles(definition: GlobalStyleObject) {
  return definition
}

export function defineUtility(utility: PropertyConfig) {
  return utility
}

export function definePlugin(plugin: PandaPlugin) {
  return plugin
}

/* -----------------------------------------------------------------------------
 * Token creators
 * -----------------------------------------------------------------------------*/

type ProxyValue<T> = {
  <Value>(definition: Value extends T ? Value : T): Value
} & {
  [K in keyof Required<T>]: <Value>(definition: Value extends T[K] ? Value : T[K]) => Value
}

function createProxy<T>(): ProxyValue<T> {
  const identity = (v: unknown) => v
  return new Proxy(identity as any, {
    get() {
      return identity
    },
  })
}

export const defineTokens = /* @__PURE__ */ createProxy<Tokens>()
export const defineSemanticTokens = /* @__PURE__ */ createProxy<SemanticTokens>()

export function defineTextStyles(definition: CompositionStyles['textStyles']) {
  return definition
}

export function defineLayerStyles(definition: CompositionStyles['layerStyles']) {
  return definition
}

export function defineStyles(definition: SystemStyleObject) {
  return definition
}

export type {
  HooksApiInterface,
  CompositionStyles,
  Config,
  CssKeyframes,
  GlobalStyleObject,
  LayerStyles,
  Preset,
  PropertyConfig,
  RecipeConfig,
  RecipeVariantRecord,
  PatternConfig,
  SemanticTokens,
  SlotRecipeConfig,
  SlotRecipeVariantRecord,
  SystemStyleObject,
  TextStyles,
  Tokens,
}
