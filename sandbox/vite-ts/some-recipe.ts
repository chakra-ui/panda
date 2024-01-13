import { defineRecipe } from '@pandacss/dev'

export const someRecipe = defineRecipe({
  className: 'some-recipe',
  base: { color: 'green', fontSize: '16px' },
  variants: {
    size: { small: { fontSize: '14px' } },
  },
  compoundVariants: [{ size: 'small', css: { color: 'blue' } }],
})
