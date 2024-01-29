import type { Config } from '@pandacss/types'
import type { AddError, ArtifactNames, TokensData } from '../types'

interface Options {
  config: Config
  tokens: TokensData
  artifacts: ArtifactNames
  addError: AddError
}

export const validateRecipes = (options: Options) => {
  const {
    config: { theme },
    artifacts,
  } = options

  if (!theme) return

  if (theme.recipes) {
    Object.keys(theme.recipes).forEach((recipeName) => {
      artifacts.recipes.add(recipeName)
    })
  }

  if (theme.slotRecipes) {
    Object.keys(theme.slotRecipes).forEach((recipeName) => {
      artifacts.slotRecipes.add(recipeName)
    })
  }

  return artifacts
}
