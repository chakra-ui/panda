import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('input', ['input', 'leftIcon', 'rightIcon'])
const parts = defineParts(anatomy.build())

// TODO focus
export const inputRecipe = defineRecipe({
  name: 'input',
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    letterSpacing: 'tight',
    border: '3px solid var(--border-color, black)',
    borderRadius: 'xl',
    ...parts({
      input: {
        paddingY: 4,
        pl: 16,
        pr: 6,
        width: '100%',
        height: '100%',
        borderRadius: 'xl',
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
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
        backgroundColor: 'panda.bg.emphasized',
        color: 'black'
      },
      black: {
        backgroundColor: 'black',
        color: 'white'
      },
      white: {
        backgroundColor: 'white',
        color: 'black'
      },
      yellow: {
        backgroundColor: 'panda.bg.main',
        color: 'panda.text.main'
      },
      border: {
        backgroundColor: 'transparent',
        color: 'panda.text.main',
        borderColor: 'panda.text.headline',
        boxShadowColor: 'panda.text.headline'
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'panda.text.main',
        border: 'none',
        shadow: 'none'
      }
    },
    size: {
      sm: {
        paddingY: 3,
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
