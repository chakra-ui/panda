import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('button', ['leftIcon', 'rightIcon'])
const parts = defineParts(anatomy.build())

// TODO hover
export const buttonRecipe = defineRecipe({
  name: 'button',
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    letterSpacing: 'tight',
    paddingX: 6,
    paddingY: 3,
    border: '3px solid var(--border-color, black)',
    boxShadow: '4px 4px 0px 0px var(--shadow-color, black)',
    borderRadius: '13px',
    ...parts({
      leftIcon: {
        marginRight: 3
      },
      rightIcon: {
        marginLeft: 3
      }
    })
  },
  variants: {
    shape: {
      square: {},
      circle: {
        borderRadius: '50%',
        flexShrink: 0
      }
    },
    color: {
      main: {
        backgroundColor: 'panda.bg.emphasized',
        color: 'black'
      },
      black: {
        backgroundColor: 'black',
        color: 'white'
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
    shape: 'square',
    color: 'main',
    size: 'md'
  }
})
