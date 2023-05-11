import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('breadcrumb', ['root', 'icon', 'item'])

const parts = defineParts(anatomy.build())

export const breadcrumbRecipe = defineRecipe({
  name: 'breadcrumbRecipe',
  description: 'A breadcrumb style',
  base: parts({
    root: {
      mt: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      overflow: 'hidden',
      textStyle: 'sm',
      color: 'gray.500',
      _moreContrast: { color: 'currentColor' }
    },
    icon: {
      w: 3.5,
      flexShrink: 0
    },
    item: {
      whiteSpace: 'nowrap',
      transitionProperty: 'colors',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '150ms',
      minWidth: '24px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      _active: {
        fontWeight: 'medium',
        color: 'gray.700',
        _moreContrast: {
          fontWeight: 'bold',
          color: 'currentColor'
        },
        _dark: {
          color: 'gray.400',
          _moreContrast: {
            color: 'currentColor'
          }
        },
        ['&[data-is-link]']: {
          color: {
            _hover: 'gray.900',
            _dark: { _hover: 'gray.200' }
          }
        }
      }
    }
  })
})
