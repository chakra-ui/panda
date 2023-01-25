import type {
  CompositionStyles,
  Conditions,
  Config,
  Dict,
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

export function defineConfig<C extends Conditions, B extends Dict, T extends Dict>(config: Config<C, B, T>): any {
  return config
}

export function defineRecipe<V extends RecipeVariantRecord>(config: RecipeConfig<V>): any {
  return config
}

export function definePattern(config: PatternConfig): any {
  return config
}

export function defineParts<T extends Parts>(parts: T) {
  return function (config: Partial<Record<keyof T, SystemStyleObject>>): Partial<Record<keyof T, SystemStyleObject>> {
    return Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value])) as any
  }
}

export function definePreset(preset: Preset): any {
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
