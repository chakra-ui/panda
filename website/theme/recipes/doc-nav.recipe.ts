import { defineSlotRecipe } from '@pandacss/dev'

/** Both rails draw their indicator at rest and only recolour it. */
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
      color: 'fg.muted',
      textDecoration: 'none',
      transitionProperty: 'color',
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
        // Past `fg`, which hover already uses, so active never reads as hover.
        color: { base: 'black', _dark: 'white' },
        fontWeight: 'medium',
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
          px: '0',
          // None on top: the first label lines up with the breadcrumb.
          pb: '1.5',
          mb: '2',
          textStyle: 'sm',
          fontWeight: 'semibold',
          color: 'fg',
          '& svg': { color: 'fg.subtle', flexShrink: 0 }
        },
        link: {
          minH: '8',
          ps: '6',
          py: '1.5',
          roundedEnd: 'md'
        }
      },
      toc: {
        label: {
          textStyle: 'eyebrow',
          color: 'fg.subtle',
          // Flush with the rail; matching the items instead orphans it.
          mb: '8'
        },
        link: {
          py: '1',
          // Item sets `--toc-depth`, so nesting isn't capped.
          ps: 'calc(token(spacing.4) * (var(--toc-depth, 0) + 1))',
          fontWeight: 'medium',
          color: 'fg.subtle',
          // Repeated from base: variants land in a later sub-layer than base,
          // so the rest colour above would otherwise win.
          _current: { color: { base: 'black', _dark: 'white' } }
        }
      }
    }
  },
  defaultVariants: { kind: 'sidebar' }
})
