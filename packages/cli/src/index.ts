import type { Conditions, Dict, RecipeConfig, RecipeVariant, Config, PatternConfig } from '@pandacss/types'

export function defineConfig<C extends Conditions, B extends Dict, T extends Dict>(config: Config<C, B, T>): any {
  return config
}

export function defineRecipe<V extends Record<string, RecipeVariant>>(config: RecipeConfig<V>): any {
  return config
}

export function definePattern(config: PatternConfig): any {
  return config
}

// TODO: defineToken, defineTokenGroup
// TODO: defineSemanticToken, defineSemanticTokenGroup
