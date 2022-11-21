import type { RecipeConfig } from '@pandacss/types'

export const recipes: Record<string, RecipeConfig> = {
  textStyle: {
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
  buttonStyle: {
    name: 'buttonStyle',
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    variants: {
      size: {
        sm: {
          height: '2.5rem',
          minWidth: '2.5rem',
          padding: '0 0.5rem',
        },
        md: {
          height: '3rem',
          minWidth: '3rem',
          padding: '0 0.75rem',
        },
      },
      variant: {
        solid: {
          backgroundColor: 'blue',
          color: 'white',
          hover: {
            backgroundColor: 'darkblue',
          },
          selectors: {
            '&[data-disabled]': {
              backgroundColor: 'gray',
              color: 'black',
            },
          },
        },
        outline: {
          backgroundColor: 'transparent',
          border: '1px solid blue',
          color: 'blue',
          hover: {
            backgroundColor: 'blue',
            color: 'white',
          },
          selectors: {
            '&[data-disabled]': {
              backgroundColor: 'transparent',
              border: '1px solid gray',
              color: 'gray',
            },
          },
        },
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
    },
  },
}
