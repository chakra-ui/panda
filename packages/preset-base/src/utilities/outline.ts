import type { UtilityConfig } from '@pandacss/types'

export const outline: UtilityConfig = {
  outlineWidth: {
    className: 'ring',
    shorthand: 'ringWidth',
    values: 'borderWidths',
  },
  outlineColor: {
    className: 'ring',
    values: 'colors',
    shorthand: 'ringColor',
  },
  outline: {
    className: 'ring',
    shorthand: 'ring',
    values: 'borders',
    transform(value) {
      if (value === 'none') {
        return { outline: '2px solid transparent', outlineOffset: '2px' }
      }
      return { outline: value }
    },
  },
  outlineOffset: {
    className: 'ring',
    shorthand: 'ringOffset',
    values: 'spacing',
  },
}
