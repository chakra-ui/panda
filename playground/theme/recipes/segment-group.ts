import { defineRecipe } from '@pandacss/dev'

export const segmentGroup = defineRecipe({
  name: 'segmentGroup',
  description: 'The styles for the segment group component',
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    px: '1',
    py: '2',

    '& [data-part="indicator"]': {
      background: 'primary',
      zIndex: '0',
      boxShadow: 'xs',
      borderRadius: 'md',
    },

    '& [data-part="radio"]': {
      zIndex: '1',
      position: 'relative',
      fontWeight: 'semibold',
      color: { base: '#778597', _dark: '#FFFFFF4D' },
      py: '1',

      cursor: 'pointer',
      display: 'flex',
    },

    '& [data-part="radio-label"]': {
      gap: '2',
      alignItems: 'center',
      alignSelf: 'center',
      color: { base: 'text.default', _checked: 'black' },
      transition: 'color 170ms ease-in-out',

      '&:not([data-checked]):hover': { color: { base: 'gray.700', _dark: 'gray.300' } },
    },
  },
})
