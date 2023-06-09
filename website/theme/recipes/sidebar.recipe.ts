import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('sidebar', [
  'container',
  'search',
  'menu-container',
  'menu-desktop',
  'menu-mobile',
  'footer',
  'toggleButton'
])

const parts = defineParts(anatomy.build())

export const sidebarRecipe = defineRecipe({
  name: 'sidebar',
  description: 'A docs sidebar style',
  jsx: ['Sidebar'],
  base: parts({
    container: {
      display: 'flex',
      flexDirection: 'column',
      mdDown: {
        _motionReduce: { transitionProperty: 'none' },
        position: 'fixed',
        pt: 'var(--nextra-navbar-height)',
        top: 0,
        bottom: 0,
        w: '100%',
        zIndex: 15,
        overscrollBehavior: 'contain',
        backgroundColor: 'white',
        _dark: { backgroundColor: 'dark' },
        transition: 'transform 0.8s cubic-bezier(0.52, 0.16, 0.04, 1)',
        willChange: 'transform, opacity',
        contain: 'layout style',
        backfaceVisibility: 'hidden',
        '& > .nextra-scrollbar': {
          maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
        }
      },
      md: {
        top: 16,
        flexShrink: 0,
        '& > .nextra-scrollbar': {
          maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
        },
        w: 20,
        _expanded: {
          w: 64
        }
      },
      _motionReduce: {
        transform: 'none'
      },
      transform: 'translate3d(0,0,0)',
      transitionProperty: 'all',
      transition: 'ease-in-out',
      _print: { display: 'none' },
      "& [data-toggle-animation='show'] button": {
        opacity: 0,
        animation: 'fadein 1s ease 0.2s forwards'
      },
      "& [data-toggle-animation='hide'] button": {
        opacity: 0,
        animation: 'fadein2 1s ease 0.2s forwards'
      }
    },
    search: {
      px: 4,
      pt: 4,
      md: { display: 'none' }
    },
    'menu-container': {
      overflowY: 'auto',
      overflowX: 'hidden',
      px: '4',
      py: '10',
      flexGrow: 1,
      md: {
        h: 'calc(100vh - var(--nextra-navbar-height) - var(--nextra-menu-height))'
      }
    },
    'menu-desktop': {
      mdDown: { display: 'none' }
    },
    'menu-mobile': {
      md: { display: 'none' }
    },
    footer: {
      position: 'sticky',
      bottom: 0,
      bg: 'white',
      _dark: {
        // when banner is showed, sidebar links can be behind menu, set bg color as body bg color
        bg: 'dark',
        borderColor: 'neutral.800',
        shadow: '0 -12px 16px #111'
      },
      mx: 4,
      py: 4,
      shadow: '0 -12px 16px #fff',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      _moreContrast: {
        bg: 'neutral.400',
        shadow: 'none',
        _dark: {
          shadow: 'none'
        }
      },
      flexWrap: 'wrap',
      justifyContent: 'center',
      '&[data-show-sidebar="true"]': {
        borderTopWidth: '1px',
        '&[data-has-i18n="true"]': {
          justifyContent: 'flex-end'
        }
      },

    },
    toggleButton: {
      mdDown: { display: 'none' },
      h: 7,
      transitionProperty: 'colors',
      color: 'gray.600',
      _dark: { color: 'gray.400' },
      px: 2,
      _hover: {
        color: 'gray.900',
        bg: 'gray.100',
        _dark: {
          color: 'gray.50',
          bg: 'rgb(219 234 254 / 0.05)'
        }
      }
    }
  })
})
