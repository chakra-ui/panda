import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const outline: UtilityConfig = {
  outlineWidth: {
    className: 'ring',
    shorthand: 'ringWidth',
    values: 'borderWidths',
    group: 'Border',
  },
  outlineColor: {
    className: 'ring',
    values: 'colors',
    group: 'Color',
    shorthand: 'ringColor',
    transform: createColorMixTransform('outlineColor'),
  },
  outline: {
    className: 'ring',
    shorthand: 'ring',
    values: 'borders',
    group: 'Border',
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
    group: 'Border',
  },
}
