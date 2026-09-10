import { defineSlotRecipe } from '@pandacss/dev'

export const calloutRecipe = defineSlotRecipe({
  className: 'callout',
  slots: ['root', 'icon', 'content'],
  description: 'A callout style',
  jsx: ['Callout'],
  base: {
    root: {
      overflowX: 'auto',
      mt: '6',
      display: 'flex',
      borderRadius: 'lg',
      borderWidth: '1px',
      py: '2',
      px: '4'
    },
    icon: {
      userSelect: 'none',
      textStyle: 'xl',
      pe: '2',
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    },
    content: {
      width: '100%',
      minWidth: 0,
      lineHeight: '1.75rem'
    }
  },
  variants: {
    type: {
      default: {
        root: {
          borderColor: 'orange.100',
          bg: 'orange.50',
          color: 'orange.800',
          _dark: {
            borderColor: 'rgb(251 146 60 / 0.3)',
            bg: 'rgb(251 146 60 / 0.2)',
            color: 'orange.300'
          }
        }
      },
      error: {
        root: {
          borderColor: 'red.100',
          bg: 'red.50',
          color: 'red.800',
          _dark: {
            borderColor: 'rgb(248 113 113 / 0.3)',
            bg: 'rgb(127 29 29 / 0.3)',
            color: 'red.200'
          }
        }
      },
      info: {
        root: {
          borderColor: 'blue.100',
          bg: 'blue.50',
          color: 'blue.800',
          _dark: {
            borderColor: 'rgb(191 219 254 / 0.3)',
            bg: 'rgb(30 58 138 / 0.3)',
            color: 'blue.200'
          }
        }
      },
      warning: {
        root: {
          borderColor: 'yellow.100',
          bg: 'yellow.50',
          color: 'yellow.800',
          _dark: {
            borderColor: 'rgb(254 240 138 / 0.3)',
            bg: 'rgb(113 63 18 / 0.3)',
            color: 'yellow.200'
          }
        }
      }
    }
  },
  defaultVariants: {
    type: 'default'
  }
})
