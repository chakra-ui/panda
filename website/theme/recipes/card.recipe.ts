import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('card', ['root', 'title', 'content'])

const parts = defineParts(anatomy.build())

export const cardRecipe = defineRecipe({
  name: 'card',
  description: 'A card style',
  jsx: ['Card'],
  base: {
    ...parts({
      root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        borderRadius: 'lg',
        border: '1px solid token(colors.gray.200)',
        color: 'currentColor',
        textDecorationLine: 'none',
        boxShadow: 'md',
        boxShadowColor: 'gray.100',
        transitionProperty: 'all',
        transitionDuration: '200ms',
        _hover: {
          boxShadowColor: 'gray.100',
          borderColor: 'gray.300'
        },
        _active: {
          boxShadow: 'sm',
          boxShadowColor: 'gray.200'
        },
        _dark: {
          _hover: { boxShadow: 'none' },
          boxShadow: 'none'
        }
      },
      title: {
        display: 'flex',
        fontWeight: 'semibold',
        alignItems: 'flex-start',
        gap: 2,
        p: 4,
        color: { base: 'gray.700', _dark: 'gray.200' },
        _hover: { color: 'gray.900', _dark: { color: 'neutral.50' } }
      }
    }),
    '& img': {
      userSelect: 'none'
    },
    '&:hover svg': {
      color: 'currentColor'
    },
    '& svg': {
      width: '1.5rem',
      color: '#00000033',
      _dark: { color: '#ffffff66', _hover: { color: 'currentColor' } },
      transition: 'color 0.3s ease'
    },
    '& p': {
      mt: '0.5rem'
    },
    '& h3': {
      counterIncrement: 'step',
      _before: {
        content: 'counter(step)',
        position: 'absolute',
        width: '33px',
        height: '33px',
        border: '4px solid white',
        backgroundColor: 'gray.100',
        _dark: {
          backgroundColor: 'neutral.800'
        },
        borderRadius: '9999px',
        color: 'neutral.400',
        fontSize: 'base',
        fontWeight: 'normal',
        textAlign: 'center',
        textIndent: '1px',
        mt: '3px',
        ml: '-41px'
      }
    }
  },
  variants: {
    variant: {
      default: parts({
        root: {
          bg: 'transparent',
          boxShadow: 'sm',
          _dark: {
            borderColor: 'neutral.800',
            _hover: {
              borderColor: 'neutral.700',
              backgroundColor: 'neutral.900'
            }
          },
          _hover: {
            bgColor: 'slate.50',
            boxShadow: 'md'
          }
        },
        content: {
          _dark: {
            color: 'neutra.200',
            _hover: { color: 'neutral.50' }
          }
        }
      }),
      image: parts({
        root: {
          bgColor: 'gray.100',
          boxShadow: 'md',
          _dark: {
            borderColor: 'neutral.700',
            backgroundColor: 'gray.100',
            color: 'gray.50',
            _hover: {
              borderColor: 'neutral.500',
              backgroundColor: 'neutral.700'
            }
          },
          _hover: {
            boxShadow: 'lg'
          }
        },
        content: {
          _dark: { color: 'gray.300', _hover: { color: 'gray.100' } }
        },
        title: {
          display: 'flex',
          gap: 1
        }
      })
    }
  }
})
