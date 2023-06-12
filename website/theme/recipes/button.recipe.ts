import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

/* -----------------------------------------------------------------------------
 * Landing Page Button Recipe
 * -----------------------------------------------------------------------------*/

const anatomy = createAnatomy('button', ['leftIcon', 'rightIcon'])
const parts = defineParts(anatomy.build())

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
        bg: 'bg.emphasized',
        color: 'black'
      },
      black: {
        bg: 'black',
        color: 'white',
        boxShadow: 'none'
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
        border: 'none',
        shadow: 'none',
        color: 'text.main'
      },
      'ghost.white': {
        bg: 'transparent',
        border: 'none',
        shadow: 'none',
        color: 'white'
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

/* -----------------------------------------------------------------------------
 * Docs Button Recipe
 * -----------------------------------------------------------------------------*/

const docsButtonAnatomy = createAnatomy('docsButton', ['root', 'icon'])
const docsButtonParts = defineParts(docsButtonAnatomy.build())

export const docsButtonRecipe = defineRecipe({
  name: 'docsButton',
  base: docsButtonParts({
    root: {
      lineHeight: '1.2',
      borderRadius: 'md',
      fontWeight: 'semibold',
      transitionProperty: 'common',
      transitionDuration: 'normal',
      _focusVisible: {
        boxShadow: 'outline'
      },
      _disabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
        boxShadow: 'none'
      },
      _hover: {
        _disabled: {
          bg: 'initial'
        }
      }
    },
    icon: {}
  }),
  variants: {
    variant: {
      solid: docsButtonParts({
        root: {
          bg: 'gray.100',
          color: 'gray.800',
          _hover: {
            bg: 'gray.200',
            _disabled: {
              bg: 'gray.100'
            }
          },
          _active: {
            bg: 'gray.300'
          }
        }
      }),
      ghost: docsButtonParts({
        root: {
          bg: 'transparent',
          color: 'gray.800',
          _hover: {
            bg: 'gray.100',
            _disabled: {
              bg: 'gray.100'
            }
          },
          _active: {
            bg: 'gray.200'
          },
          _dark: {
            color: 'gray.50',
            _hover: {
              bg: 'whiteAlpha.200',
              _disabled: {
                bg: 'whiteAlpha.200'
              }
            },
            _active: {
              bg: 'whiteAlpha.300'
            }
          }
        }
      })
    },
    size: {
      lg: {
        h: '12',
        minW: '12',
        fontSize: 'lg',
        px: '6'
      },
      md: {
        h: '10',
        minW: '10',
        fontSize: 'md',
        px: '4'
      },
      sm: {
        h: '8',
        minW: '8',
        fontSize: 'sm',
        px: '3'
      },
      xs: {
        h: '7',
        minW: '6',
        fontSize: 'xs',
        px: '2'
      }
    }
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
})
