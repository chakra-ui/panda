import { defineRecipe } from '@pandacss/dev'

export const codeRecipe = defineRecipe({
  name: 'code',
  base: {
    m: '0!',
    px: 4,
    py: 6,
    backgroundColor: 'transparent!',
    borderRadius: '16px!'
  }
})
