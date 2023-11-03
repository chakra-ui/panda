import { defineRecipe } from '@pandacss/dev'

export const ccc = defineRecipe({
  className: 'ccc1',
  base: {
    fontSize: 'lg',
    color: 'red.300',
  },
  variants: {
    size: {
      sm: {
        fontSize: 'sm',
      },
    },
  },
})
