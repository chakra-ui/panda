import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('navbar', [
  'root',
  'blur',
  'nav',
  'logoLink',
  'menuLink',
  'menuLinkIcon',
  'navLink',
  'navLinkText',
  'projectLink',
  'chatLink',
  'mobileMenu'
])

const parts = defineParts(anatomy.build())

export const navbarRecipe = defineRecipe({
  className: 'navbar',
  description: 'A navbar style',
  jsx: ['Navbar'],
  base: parts({
    root: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      w: 'full',
      bg: 'transparent',
      _print: { display: 'none' }
    },
    blur: {
      pointerEvents: 'none',
      position: 'absolute',
      zIndex: -1,
      h: 'full',
      w: 'full',
      bg: 'white',
      _dark: {
        bg: 'dark',
        shadow: '0 -1px 0 rgba(255,255,255,.1) inset'
      },
      shadow: '0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)',
      _supportsBackdrop: {
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.85) !important',
        _dark: {
          backgroundColor: 'hsla(0,0%,7%,.8) !important'
        }
      }
    },
    nav: {
      mx: 'auto',
      display: 'flex',
      h: 'var(--nextra-navbar-height)',
      maxW: '90rem',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '2',
      pl: 'max(env(safe-area-inset-left),1.5rem)',
      pr: 'max(env(safe-area-inset-right),1.5rem)'
    },
    logoLink: {
      display: 'flex',
      alignItems: 'center',
      _hover: { opacity: 0.75 },
      marginEnd: 'auto'
    },
    menuLink: {
      textStyle: 'sm',
      display: 'flex',
      gap: '1'
    },
    menuLinkIcon: {
      h: '18px',
      minW: '18px',
      rounded: 'sm',
      p: '0.5'
    },
    navLink: {
      textStyle: 'sm',
      position: 'relative',
      ml: '-2',
      display: 'none',
      whiteSpace: 'nowrap',
      p: '2',
      md: { display: 'inline-block' }
    },
    navLinkText: {
      position: 'absolute',
      insetX: '0',
      textAlign: 'center'
    },
    mobileMenu: {
      mr: '-2',
      rounded: 'sm',
      p: '2',
      _active: { bg: 'rgb(156 163 175 / 0.2)' },
      md: { display: 'none' },
      '& svg': {
        '& g': {
          transformOrigin: 'center',
          transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
        },
        '& path': {
          opacity: 1,
          transition:
            'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s, opacity 0.2s ease 0.2s'
        },
        '&.open': {
          '& path': {
            transition:
              'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease'
          },
          '& g': {
            transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s'
          }
        },
        '&.open >': {
          '& path': {
            opacity: 0
          },
          '& g:nth-of-type(1)': {
            transform: 'rotate(45deg)',
            '& path': {
              transform: 'translate3d(0, 6px, 0)'
            }
          },
          '& g:nth-of-type(2)': {
            transform: 'rotate(-45deg)',
            '& path': {
              transform: 'translate3d(0, -6px, 0)'
            }
          }
        }
      }
    }
  })
})
