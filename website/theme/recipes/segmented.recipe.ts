import { segmentGroupAnatomy } from '@ark-ui/react/segment-group'
import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts(segmentGroupAnatomy.build())

export const segmentedRecipe = defineRecipe({
  className: 'segmented',
  description: 'A segmented control. Selection changes colour, never geometry.',
  jsx: ['Segmented'],
  base: parts({
    root: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'stretch',
      borderWidth: '1px',
      borderColor: 'border',
      rounded: 'md',
      overflow: 'hidden'
    },
    item: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2',
      minH: '10',
      px: '4',
      textStyle: 'sm',
      fontWeight: 'medium',
      color: 'fg.muted',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transitionProperty: 'color, background-color',
      transitionDuration: '150ms',
      _hover: { color: 'fg' },
      _checked: { color: 'fg' },
      _disabled: { cursor: 'not-allowed', opacity: '0.5' },
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'blue.500',
        outlineOffset: '-2px'
      }
    },
    indicator: {
      bg: 'bg.muted',
      rounded: 'sm',
      zIndex: '0'
    },
    itemText: {
      position: 'relative',
      zIndex: '1'
    }
  }),
  variants: {
    size: {
      sm: parts({
        item: { minH: '9', px: '3', textStyle: 'sm' }
      }),
      md: parts({
        item: { minH: '10', px: '4' }
      })
    },
    tone: {
      neutral: parts({
        indicator: { bg: 'bg.muted' }
      }),
      accent: parts({
        root: { rounded: 'lg' },
        indicator: { bg: 'accent.wash' },
        item: { minH: '11' }
      }),
      pill: parts({
        root: {
          rounded: 'full',
          bg: 'bg.muted',
          p: '1',
          borderColor: 'transparent'
        },
        indicator: {
          rounded: 'full',
          bg: 'accent.wash',
          borderWidth: '1px',
          borderColor: 'accent.emphasis'
        },
        item: {
          minH: '9',
          px: '4',
          gap: '2',
          _checked: { fontWeight: 'semibold' }
        }
      }),
      card: parts({
        root: {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '3',
          borderWidth: '0',
          rounded: 'none',
          overflow: 'visible',
          md: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }
        },
        indicator: { display: 'none' },
        item: {
          flexDirection: 'column',
          gap: '3',
          minH: '7.5rem',
          px: '4',
          borderWidth: '1px',
          borderColor: 'border',
          rounded: 'lg',
          textStyle: 'sm',
          '& svg': { width: '1.75rem', height: '1.75rem' },
          _hover: { borderColor: 'fg.subtle', bg: 'bg.subtle' },
          _checked: {
            borderColor: 'accent.emphasis',
            bg: 'accent.wash',
            color: 'fg'
          }
        }
      })
    }
  },
  defaultVariants: { size: 'md', tone: 'neutral' }
})
