import { defineRecipe } from '@pandacss/dev'

export const dddFff = defineRecipe({
  className: 'dddFff',
  base: {
    fontSize: 'lg',
    color: 'blue.300',
  },
  variants: {
    size: {
      sm: {
        fontSize: 'sm',
      },
    },
  },
})
