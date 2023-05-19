import { defineRecipe } from '@pandacss/dev'

export const contentRecipe = defineRecipe({
  name: 'content',
  base: {
    display: 'flex',
    flexDirection: 'column',
    w: '100%',
    maxWidth: {
      base: '3xl',
      sm: '4xl',
      md: '5xl',
      lg: '6xl',
      xl: '7xl',
      '2xl': '8xl'
    },
    px: {
      base: 4,
      md: 5,
      xl: 6
    }
  }
})
