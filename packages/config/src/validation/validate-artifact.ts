import type { AddError, ArtifactNames } from '../types'

export const validateArtifactNames = (names: ArtifactNames, addError: AddError) => {
  names.recipes.forEach((recipeName) => {
    if (names.slotRecipes.has(recipeName)) {
      addError('recipes', `This recipe name is already used in \`theme.slotRecipes\`: ${recipeName}`)
    }

    if (names.patterns.has(recipeName)) {
      addError('recipes', `This recipe name is already used in \`patterns\`: \`${recipeName}\``)
    }
  })

  names.slotRecipes.forEach((recipeName) => {
    if (names.patterns.has(recipeName)) {
      addError('recipes', `This recipe name is already used in \`patterns\`: ${recipeName}`)
    }
  })
}
