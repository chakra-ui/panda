import { defineRecipe } from '@pandacss/dev'

export const button = defineRecipe({
  className: 'button',
  description: 'The styles for the button component',
  base: {
    borderRadius: 'lg',
    fontWeight: 'semibold',
    cursor: 'pointer',
    px: '3',
    py: '2',
    transition: 'background 0.2s ease',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  variants: {
    visual: {
      gray: {
        bg: { base: 'gray.100', _dark: '#3A3A3AFF' },
        _hover: {
          bg: { base: 'gray.200', _dark: '#343232' },
        },
      },
      yellow: {
        bg: 'yellow.300',
        _hover: {
          bg: 'yellow.400',
        },
        color: { _dark: 'black' },
      },
    },
  },

  defaultVariants: {
    visual: 'gray',
  },
})
