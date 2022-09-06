import type { Conditions, Dict, Recipe, RecipeVariant, Config } from '@css-panda/types'

export function defineConfig<C extends Conditions, B extends Dict, T extends Dict>(config: Config<C, B, T>): any {
  return config
}

export function defineRecipe<V extends Record<string, RecipeVariant>>(config: Recipe<V>): any {
  return config
}
