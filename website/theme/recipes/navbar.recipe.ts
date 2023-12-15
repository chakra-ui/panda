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
  'secNav',
  'mobileMenu',
  'navFolder',
  'folderContent',
  'arrow',
  'arrowTip'
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
      _print: { display: 'none' },
      h: 'var(--nextra-navbar-height)',
      display: 'flex',
      flexDir: 'column'
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
      display: 'flex',
      maxW: '90rem',
      mx: 'auto',
      w: 'full',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '2',
      pl: 'max(env(safe-area-inset-left),1.5rem)',
      pr: 'max(env(safe-area-inset-right),1.5rem)',
      pt: 'max(env(safe-area-inset-top),0.625rem)'
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
    },
    secNav: {
      display: 'flex',
      maxW: '90rem',
      mx: 'auto',
      w: 'full',
      alignItems: 'center',
      gap: { base: '4', lg: '8' },
      pl: 'max(env(safe-area-inset-left),1.5rem)',
      pr: 'max(env(safe-area-inset-right),1.5rem)',
      flexGrow: '1',
      overflowX: 'auto'
    },
    navFolder: {
      cursor: 'pointer',
      display: 'flex',
      h: 'full',
      gap: '2',
      alignItems: 'center',
      borderBottom: '2px solid transparent',
      borderColor: { _currentPage: 'currentcolor' },
      color: {
        base: 'gray.500',
        _hover: 'gray.900',
        _currentPage: { base: 'black', _dark: 'white' },
        _dark: { base: 'gray.400', _hover: 'gray.50' }
      },
      fontWeight: { _currentPage: 'semibold' },
      '& > svg': {
        w: '3.5',
        transform: 'rotate(90deg)',
        strokeWidth: '1'
      }
    },
    folderContent: {
      '--popover-background': 'colors.white',
      _dark: {
        '--popover-background': 'colors.neutral.900'
      },
      background: 'var(--popover-background)',
      borderRadius: 'lg',
      borderWidth: '1px',
      boxShadow: 'lg',
      maxW: 'lg',
      p: '4',
      position: 'relative',
      zIndex: '20',
      _open: {
        animation: 'fadeIn 0.25s ease-out'
      },
      _closed: {
        animation: 'fadeOut 0.2s ease-out',
        display: 'none'
      }
    },
    arrow: {
      '--arrow-size': 'sizes.3',
      '--arrow-background': 'var(--popover-background)'
    },
    arrowTip: {
      borderTopWidth: '1px',
      borderLeftWidth: '1px'
    }
  })
})
