import { defineRecipe } from '@pandacss/dev'

export const buttonRecipe = defineRecipe({
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
    size: {
      lg: { h: '12', minW: '12', fontSize: 'lg', px: '6' },
      md: { h: '10', minW: '10', fontSize: 'md', px: '4' },
      sm: { h: '8', minW: '8', fontSize: 'sm', px: '3' },
      xs: { h: '6', minW: '6', fontSize: 'xs', px: '2' },
    },
  },

  defaultVariants: {
    visual: 'gray',
  },
})
