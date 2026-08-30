import { defineSlotRecipe } from '@pandacss/dev'

/**
 * The sidebar and table-of-contents rails. Both draw their indicator at rest and
 * only change its colour, so the active item never re-measures the list.
 */
export const docNavRecipe = defineSlotRecipe({
  className: 'docNav',
  description: 'Sidebar and table-of-contents navigation rails',
  slots: ['root', 'label', 'list', 'link'],
  jsx: ['DocNav'],
  base: {
    list: {
      display: 'flex',
      flexDirection: 'column',
      borderInlineStartWidth: '1px',
      borderColor: 'border'
    },
    link: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '2',
      ml: '-1px',
      pe: '3',
      textStyle: 'sm',
      fontWeight: 'medium',
      color: 'fg.muted',
      bg: 'transparent',
      textDecoration: 'none',
      transitionProperty: 'background-color, color',
      transitionDuration: '150ms',
      _before: {
        content: '""',
        position: 'absolute',
        insetY: '0',
        insetStart: '0',
        width: '2px',
        bg: 'transparent',
        transitionProperty: 'background-color',
        transitionDuration: '150ms'
      },
      _hover: { color: 'fg' },
      _current: {
        color: 'fg',
        _before: { bg: 'accent.emphasis' }
      },
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '-2px'
      }
    }
  },
  variants: {
    kind: {
      sidebar: {
        label: {
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          px: '3',
          py: '2',
          textStyle: 'sm',
          fontWeight: 'semibold',
          color: 'fg'
        },
        link: {
          minH: '8',
          ps: '4',
          py: '1.5',
          roundedEnd: 'md',
          _hover: { bg: 'bg.subtle' },
          _current: { bg: 'accent.wash' }
        }
      },
      toc: {
        label: {
          textStyle: 'eyebrow',
          color: 'fg.subtle',
          mb: '8'
        },
        link: {
          py: '1',
          color: 'fg.subtle'
        }
      }
    }
  },
  defaultVariants: { kind: 'sidebar' }
})
