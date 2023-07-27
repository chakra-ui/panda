import { defineParts, defineRecipe } from '@pandacss/dev'
import { segmentGroupAnatomy } from '@ark-ui/react'

const parts = defineParts(segmentGroupAnatomy.build())

export const segmentGroup = defineRecipe({
  name: 'segmentGroup',
  description: 'The styles for the segment group component',
  base: parts({
    root: {
      display: 'flex',
      alignItems: 'center',
      gap: '4',
      px: '1',
      py: '2',
    },
    indicator: {
      background: 'primary',
      zIndex: '0',
      boxShadow: 'xs',
      borderRadius: 'md',
    },
    radio: {
      zIndex: '1',
      position: 'relative',
      fontWeight: 'semibold',
      color: { base: '#778597', _dark: '#FFFFFF4D' },
      py: '1',

      cursor: 'pointer',
      display: 'flex',
    },
    radioLabel: {
      color: { base: 'text.default', _checked: 'black' },
      transition: 'color 170ms ease-in-out',

      '&:not([data-state="checked"]):hover': { color: { base: 'gray.700', _dark: 'gray.300' } },
    },
  }),
})
