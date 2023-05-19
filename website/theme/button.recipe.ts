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
    transitionProperty: 'all',
    '&:is(a, button)': {
      _hover: {
        boxShadow: '6px 6px 0px 0px var(--shadow-color, black)'
      }
    },
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
        color: 'black',
        '&:is(a, button)': {
          _hover: {
            backgroundColor: 'panda.gray.400',
            color: 'white'
          }
        }
      },
      black: {
        backgroundColor: 'black',
        color: 'white',
        boxShadow: 'none',
        '&:is(a, button)': {
          _hover: {
            backgroundColor: 'white',
            color: 'black'
          }
        }
      },
      white: {
        backgroundColor: 'white',
        color: 'black',
        '&:is(a, button)': {
          _hover: {
            backgroundColor: 'black',
            color: 'white'
          }
        }
      },
      yellow: {
        backgroundColor: 'panda.bg.main',
        color: 'panda.text.main',
        '&:is(a, button)': {
          _hover: {
            backgroundColor: 'panda.gray.400',
            color: 'white'
          }
        }
      },
      border: {
        backgroundColor: 'transparent',
        color: 'panda.text.main',
        borderColor: 'panda.text.headline',
        boxShadowColor: 'panda.text.headline'
      },
      ghost: {
        backgroundColor: 'transparent',
        border: 'none',
        shadow: 'none',
        color: 'panda.text.main',
        '&:is(a, button)': {
          _hover: {
            backgroundColor: 'panda.yellow',
            color: 'black'
          }
        }
      },
      'ghost.white': {
        backgroundColor: 'transparent',
        border: 'none',
        shadow: 'none',
        color: 'white',
        '&:is(a, button)': {
          _hover: {
            backgroundColor: 'panda.yellow',
            color: 'black',
            ...parts({
              leftIcon: {
                color: 'black!'
              },
              rightIcon: {
                color: 'black!'
              }
            })
          }
        }
      }
    },
    size: {
      sm: {
        paddingY: 3,
        textStyle: 'lg'
      },
      md: {
        textStyle: 'md',
        md: {
          textStyle: 'lg'
        },
        lg: {
          textStyle: 'xl'
        }
      },
      lg: {
        textStyle: '2xl'
      },
      xl: {
        fontSize: '2rem',
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
