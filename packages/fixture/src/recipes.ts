import type { RecipeConfig } from '@pandacss/types'

export const recipes: Record<string, RecipeConfig> = {
  textStyle: {
    className: 'textStyle',
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
  tooltipStyle: {
    className: 'tooltipStyle',
    base: {
      '&[data-tooltip], & [data-tooltip]': {
        color: { _dark: 'red' },
      },
    },
  },
  buttonStyle: {
    className: 'buttonStyle',
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
          _hover: {
            backgroundColor: 'darkblue',
          },
          '&[data-disabled]': {
            backgroundColor: 'gray',
            color: 'black',
          },
        },
        outline: {
          backgroundColor: 'transparent',
          border: '1px solid blue',
          color: 'blue',
          _hover: {
            backgroundColor: 'blue',
            color: 'white',
          },
          '&[data-disabled]': {
            backgroundColor: 'transparent',
            border: '1px solid gray',
            color: 'gray',
          },
        },
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'solid',
    },
  },

  pillStyle: {
    className: 'pillStyle',
    base: {
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: 'bold',
    },

    variants: {
      size: {
        small: {
          fontSize: '14px',
          padding: '4px 8px',
        },
        medium: {
          fontSize: '16px',
          padding: '8px 16px',
        },
        large: {
          fontSize: '18px',
          padding: '12px 24px',
        },
      },
      color: {
        primary: {
          backgroundColor: 'blue',
          color: 'white',
        },
        secondary: {
          backgroundColor: 'gray',
          color: 'black',
        },
      },
      disabled: {
        true: {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      },
    },
    compoundVariants: [
      {
        size: 'small',
        color: 'primary',
        css: {
          border: '2px solid blue',
        },
      },
      {
        size: 'large',
        color: 'secondary',
        disabled: true,
        css: {
          backgroundColor: 'lightgray',
          color: 'darkgray',
          border: 'none',
        },
      },
      {
        size: ['small', ' medium'],
        color: 'secondary',
        css: {
          fontWeight: 'extrabold',
        },
      },
    ],
  },
}
