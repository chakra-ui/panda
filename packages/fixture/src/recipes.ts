import type { Recipe } from '@css-panda/types'

export const recipes: Recipe[] = [
  {
    name: 'textStyle',
    base: {
      fontFamily: 'mono',
      divideX: '20px',
    },
    variants: {
      size: {
        h1: {
          fontSize: '5rem',
          lineHeight: '1em',
          fontWeight: 800,
        },
        h2: {
          fontSize: '3rem',
          lineHeight: '1.2em',
          fontWeight: 700,
          letterSpacing: '-0.03em',
        },
      },
    },
  },
]
