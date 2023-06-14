import type {
  CompositionStyles,
  Config,
  CssKeyframes,
  GlobalStyleObject,
  Parts,
  PatternConfig,
  Preset,
  RecipeConfig,
  RecipeVariantRecord,
  SemanticTokens,
  SystemStyleObject,
  Tokens,
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

export function definePattern<T extends PatternConfig>(config: T) {
  return config as PatternConfig
}

export function defineParts<T extends Parts>(parts: T) {
  return function (config: Partial<Record<keyof T, SystemStyleObject>>): Partial<Record<keyof T, SystemStyleObject>> {
    return Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value])) as any
  }
}

export function definePreset(preset: Preset): Preset {
  return preset
}

export function defineKeyframes(keyframes: CssKeyframes) {
  return keyframes
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

export const defineTokens = createProxy<Tokens>()
export const defineSemanticTokens = createProxy<SemanticTokens>()

export function defineTextStyles(definition: CompositionStyles['textStyles']) {
  return definition
}

export function defineLayerStyles(definition: CompositionStyles['layerStyles']) {
  return definition
}

export function defineStyles(definition: SystemStyleObject) {
  return definition
}

/* -----------------------------------------------------------------------------
 * Global styles
 * -----------------------------------------------------------------------------*/

export function defineGlobalStyles(definition: GlobalStyleObject) {
  return definition
}
