import { button } from './button'
import { splitter } from './splitter'
import { segmentGroup } from './segment-group'
import { menu } from './menu'
import { toast } from './toast'
import { RecipeConfig } from '@pandacss/types'

export const recipes = {
  button,
  splitter,
  segmentGroup,
  menu,
  toast,
} as Record<string, RecipeConfig>
