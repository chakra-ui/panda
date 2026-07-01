import type { UserConfig } from '@pandacss/types'

export function collectRecipeNames(config: Pick<UserConfig, 'theme'> | undefined): string[] {
  const theme = config?.theme
  if (!theme) return []
  const names = new Set([...Object.keys(theme.recipes ?? {}), ...Object.keys(theme.slotRecipes ?? {})])
  return [...names].sort()
}

export function collectPatternNames(config: Pick<UserConfig, 'patterns'> | undefined): string[] {
  return Object.keys(config?.patterns ?? {}).sort()
}
