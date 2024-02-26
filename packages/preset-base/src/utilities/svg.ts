import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const svg: UtilityConfig = {
  fill: {
    className: 'fill',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('fill'),
  },
  stroke: {
    className: 'stroke',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('stroke'),
  },
  strokeWidth: {
    className: 'stroke-w',
    values: 'borderWidths',
    group: 'Border',
  },
}
