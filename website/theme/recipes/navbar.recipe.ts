import { createAnatomy } from '@ark-ui/react/anatomy'
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
      position: 'fixed',
      top: 0,
      zIndex: 20,
      w: 'calc(100% - var(--scrollbar-width, 0px))',
      bg: 'transparent',
      _print: { display: 'none' }
    },
    blur: {
      pointerEvents: 'none',
      position: 'absolute',
      zIndex: -1,
      h: 'full',
      w: 'full',
      bg: 'bg.surface',
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
      h: 'var(--navbar-height, 4rem)',
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
      hideFrom: 'lg',
      _icon: { boxSize: '5' }
    }
  })
})
