import { defineSlotRecipe } from '@pandacss/dev'

export const docCardRecipe = defineSlotRecipe({
  className: 'docCard',
  slots: ['root', 'icon', 'kicker', 'title', 'body', 'cta'],
  description:
    'A navigation card. Hover softens the background only — no lift or border shift.',
  jsx: ['DocCard'],
  base: {
    root: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '2',
      height: 'full',
      p: '5',
      borderWidth: '1px',
      borderColor: 'border',
      color: 'fg',
      textDecoration: 'none',
      transitionProperty: 'background-color',
      transitionDuration: '150ms',
      _hover: { bg: 'bg.subtle' },
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '2px'
      }
    },
    icon: {
      display: 'flex',
      color: 'accent.emphasis',
      mb: '1',
      '& svg': { width: '1.25rem', height: '1.25rem' }
    },
    kicker: {
      textStyle: 'eyebrow',
      color: 'fg.subtle'
    },
    title: {
      textStyle: 'lg',
      fontWeight: 'semibold',
      lineHeight: '1.3'
    },
    body: {
      textStyle: 'sm',
      lineHeight: '1.6',
      color: 'fg.muted'
    },
    cta: {
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      mt: 'auto',
      pt: '3',
      textStyle: 'sm',
      color: 'fg.muted'
    }
  },
  variants: {
    mode: {
      gapped: {
        root: { rounded: 'lg' }
      },
      gapless: {
        root: {
          rounded: 'none',
          p: '4',
          gap: '1',
          marginBlockStart: '-1px',
          marginInlineStart: '-1px'
        }
      }
    }
  },
  defaultVariants: { mode: 'gapped' }
})
