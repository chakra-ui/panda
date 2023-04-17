import type {
  AnyRecipeConfig,
  CompositionStyles,
  GenericConfig,
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

export function defineConfig<RecipeVariants>(config: GenericConfig<RecipeVariants>) {
  return config
}

export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): AnyRecipeConfig {
  return config as AnyRecipeConfig
}

export function definePattern(config: PatternConfig): PatternConfig {
  return config
}

export function defineParts<T extends Parts>(parts: T) {
  return function (config: Partial<Record<keyof T, SystemStyleObject>>): Partial<Record<keyof T, SystemStyleObject>> {
    return Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value])) as any
  }
}

export function definePreset(preset: Preset): Preset {
  return preset
}

/* -----------------------------------------------------------------------------
 * Token creators
 * -----------------------------------------------------------------------------*/

type ProxyValue<T> = {
  [K in keyof T]: (definition: T[K]) => T[K]
}

function createProxy<T>(): ProxyValue<Required<T>> {
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

/* -----------------------------------------------------------------------------
 * Global styles
 * -----------------------------------------------------------------------------*/

export function defineGlobalStyles(definition: GlobalStyleObject) {
  return definition
}
