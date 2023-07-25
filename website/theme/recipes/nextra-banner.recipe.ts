import { createAnatomy } from '@ark-ui/react'
import { defineParts, defineRecipe } from '@pandacss/dev'

const anatomy = createAnatomy('banner', [
  'root',
  'content',
  'closeButton',
  'closeIcon'
])

const parts = defineParts(anatomy.build())

export const nextraBannerRecipe = defineRecipe({
  className: 'nextraBannerRecipe',
  description: 'A nextra banner style',
  base: parts({
    root: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      md: { position: 'relative' },
      h: 'var(--nextra-banner-height)',
      '& ~ div': {
        '& .nextra-sidebar-container': {
          // pt: '1.5rem'
        },
        '&.nextra-nav-container': {
          top: 10,
          md: { top: 0 }
        }
      },
      'body.nextra-banner-hidden &': {
        display: 'none',
        '& ~ div': {
          '& .nextra-sidebar-container': {
            pt: '16'
          },
          '&.nextra-nav-container': {
            top: 0
          }
        }
      },
      color: 'gray.50',
      bg: 'neutral.900',
      _dark: {
        color: 'white',
        bg: 'linear-gradient(1deg,#383838,#212121)'
      },
      px: 2,
      _ltr: { pl: 10 },
      _rtl: { pr: 10 },
      _print: { display: 'none' }
    },
    content: {
      w: 'full',
      truncate: true,
      px: 4,
      textAlign: 'center',
      fontWeight: 'medium',
      textStyle: 'sm'
    },
    closeButton: {
      w: 8,
      h: 8,
      opacity: 0.8,
      color: 'gray.50',
      _dark: { color: 'white' },
      _hover: { opacity: 1 }
    },
    closeIcon: {
      mx: 'auto',
      h: 4,
      w: 4
    }
  })
})
