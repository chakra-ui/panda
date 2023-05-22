import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('input', ['input', 'leftIcon', 'rightIcon'])
const parts = defineParts(anatomy.build())

export const inputRecipe = defineRecipe({
  name: 'input',
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    letterSpacing: 'tight',
    border: '3px solid var(--border-color, black)',
    borderRadius: 'xl',
    ...parts({
      input: {
        py: 4,
        pl: 16,
        pr: 6,
        width: '100%',
        height: '100%',
        borderRadius: 'xl',
        border: 'none',
        outline: 'none',
        bg: 'transparent',
        color: 'black'
      },
      leftIcon: {
        position: 'absolute',
        left: 6
      },
      rightIcon: {
        position: 'absolute',
        right: 6
      }
    })
  },
  variants: {
    color: {
      main: {
        bg: 'bg.emphasized',
        color: 'black'
      },
      black: {
        bg: 'black',
        color: 'white'
      },
      white: {
        bg: 'white',
        color: 'black'
      },
      yellow: {
        bg: 'bg.main',
        color: 'text.main'
      },
      border: {
        bg: 'transparent',
        color: 'text.main',
        borderColor: 'text.headline',
        boxShadowColor: 'text.headline'
      },
      ghost: {
        bg: 'transparent',
        color: 'text.main',
        border: 'none',
        shadow: 'none'
      }
    },
    size: {
      sm: {
        py: 3,
        fontSize: '18px'
      },
      md: {
        fontSize: '21px'
      },
      lg: {
        fontSize: '24px'
      },
      xl: {
        fontSize: '32px',
        fontWeight: 'bold'
      }
    }
  },
  defaultVariants: {
    color: 'main',
    size: 'md'
  }
})
