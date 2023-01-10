import type {
  Conditions,
  Dict,
  RecipeConfig,
  RecipeVariant,
  Config,
  PatternConfig,
  Parts,
  SystemStyleObject,
} from '@pandacss/types'

export function defineConfig<C extends Conditions, B extends Dict, T extends Dict>(config: Config<C, B, T>): any {
  return config
}

export function defineRecipe<V extends Record<string, RecipeVariant>>(config: RecipeConfig<V>): any {
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
