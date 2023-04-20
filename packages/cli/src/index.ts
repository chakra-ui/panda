import type {
  AnyPatternConfig,
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

export function defineConfig<RecipeVariants, PatternProps>(config: GenericConfig<RecipeVariants, PatternProps>) {
  return config
}

export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): AnyRecipeConfig {
  return config as AnyRecipeConfig
}

export function definePattern<Pattern>(config: PatternConfig<Pattern>) {
  return config as AnyPatternConfig
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

/* -----------------------------------------------------------------------------
 * Global styles
 * -----------------------------------------------------------------------------*/

export function defineGlobalStyles(definition: GlobalStyleObject) {
  return definition
}
