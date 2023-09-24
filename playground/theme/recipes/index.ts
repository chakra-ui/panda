import { defineRecipeConfigs } from '@pandacss/dev'

import { button } from './button'
import { splitter } from './splitter'
import { segmentGroup } from './segment-group'
import { menu } from './menu'
import { toast } from './toast'

export const recipes = defineRecipeConfigs({
  button,
  splitter,
  segmentGroup,
  menu,
  toast,
})
