import type { RecipeConfig, SlotRecipeConfig } from '@pandacss/types'

export const isSlotRecipe = (v: RecipeConfig | SlotRecipeConfig): v is SlotRecipeConfig =>
  'slots' in v && Array.isArray(v.slots) && v.slots.length > 0
