import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('callout', ['root', 'icon', 'content'])

const parts = defineParts(anatomy.build())

export const calloutRecipe = defineRecipe({
  className: 'callout',
  description: 'A callout style',
  jsx: ['Callout'],
  base: parts({
    root: {
      overflowX: 'auto',
      mt: 6,
      display: 'flex',
      borderRadius: 'lg',
      border: '1px solid',
      py: 2,
      _ltr: { pr: 4 },
      _rtl: { pl: 4 },
      _moreContrast: {
        color: 'currentColor',
        _dark: { borderColor: 'currentColor' }
      }
    },
    icon: {
      userSelect: 'none',
      textStyle: 'xl',
      _ltr: { pl: 3, pr: 2 },
      _rtl: { pr: 3, pl: 2 },
      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
    },
    content: {
      width: '100%',
      minWidth: 0,
      lineHeight: '1.75rem'
    }
  }),
  variants: {
    type: {
      default: parts({
        root: {
          borderColor: 'orange.100',
          backgroundColor: 'orange.50',
          color: 'orange.800',
          _dark: {
            borderColor: 'rgb(251 146 60 / 0.3)', // opacity modifier
            backgroundColor: 'rgb(251 146 60 / 0.2)',
            color: 'orange.300'
          }
        }
      }),
      error: parts({
        root: {
          borderColor: 'red.100',
          backgroundColor: 'red.50',
          color: 'red.800',
          _dark: {
            borderColor: 'rgb(248 113 113 / 0.3)',
            backgroundColor: 'rgb(127 29 29 / 0.3)',
            color: 'red.200'
          }
        }
      }),
      info: parts({
        root: {
          borderColor: 'blue.100',
          backgroundColor: 'blue.50',
          color: 'blue.800',
          _dark: {
            borderColor: 'rgb(191 219 254 / 0.3)',
            backgroundColor: 'rgb(30 58 138 / 0.3)',
            color: 'blue.200'
          }
        }
      }),
      warning: parts({
        root: {
          borderColor: 'yellow.100',
          backgroundColor: 'yellow.50',
          color: 'yellow.800',
          _dark: {
            borderColor: 'rgb(254 240 138 / 0.3)',
            backgroundColor: 'rgb(113 63 18 / 0.3)',
            color: 'yellow.200'
          }
        }
      })
    }
  },
  defaultVariants: {
    type: 'default'
  }
})
