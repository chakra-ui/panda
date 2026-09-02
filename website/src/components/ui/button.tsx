import { cva } from '@/styled-system/css'
import { panda } from '@/styled-system/jsx'
import Link from 'next/link'

const buttonRecipe = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'background'
  },

  variants: {
    shape: {
      circle: {
        borderRadius: '50%'
      }
    },

    variant: {
      funky: {
        borderRadius: '13px',
        border: '3px solid var(--border-color, black)',
        boxShadow: '4px 4px 0px 0px var(--shadow-color, black)',
        _hover: {
          boxShadow: '6px 6px 0px 0px var(--shadow-color, black)'
        }
      },
      outline: {
        borderRadius: 'sm',
        borderWidth: '1px',
        borderColor: 'border'
      }
    },

    color: {
      www: {
        color: { base: 'black', _hover: 'white' },
        bg: { base: 'yellow.300', _hover: 'gray.400' }
      },
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
        color: 'fg'
      },
      border: {
        bg: 'transparent',
        color: 'fg',
        borderColor: 'fg.headline',
        boxShadowColor: 'fg.headline'
      },
      ghost: {
        bg: 'transparent',
        border: 'none',
        shadow: 'none',
        color: 'fg'
      },
      'ghost.white': {
        bg: 'transparent',
        border: 'none',
        shadow: 'none',
        color: 'white',
        _icon: {
          color: 'yellow.400'
        }
      },
      neutral: {
        bg: 'bg',
        _hover: {
          bg: 'bg.subtle'
        }
      }
    },

    size: {
      icon: {
        minW: '6',
        minH: '6',
        gap: '2',
        px: '2',
        py: '2'
      },
      xs: {
        textStyle: 'sm',
        gap: '2',
        px: '4',
        py: '2'
      },
      sm: {
        textStyle: 'lg',
        gap: '3',
        px: '6',
        py: '3'
      },
      md: {
        gap: '3',
        px: '6',
        py: '3',
        textStyle: { base: 'md', md: 'lg', lg: 'xl' }
      },
      lg: {
        gap: '3',
        px: '6',
        py: '3',
        textStyle: '2xl'
      },
      xl: {
        gap: '3',
        px: '6',
        py: '3',
        fontSize: '2rem',
        fontWeight: 'bold'
      }
    }
  },

  defaultVariants: {
    color: 'main',
    size: 'md',
    variant: 'outline'
  }
})

export const ButtonLink = panda(Link, buttonRecipe)

export const Button = panda('button', buttonRecipe)
