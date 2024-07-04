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
    className: 'stk',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('stroke'),
  },
  strokeWidth: {
    className: 'stk-w',
    values: 'borderWidths',
    group: 'Border',
  },
  strokeDasharray: {
    className: 'stk-dsh',
    group: 'Border',
  },
  strokeDashoffset: {
    className: 'stk-do',
    group: 'Border',
  },
  strokeLinecap: {
    className: 'stk-lc',
    group: 'Border',
  },
  strokeLinejoin: {
    className: 'stk-lj',
    group: 'Border',
  },
  strokeMiterlimit: {
    className: 'stk-ml',
    group: 'Border',
  },
  strokeOpacity: {
    className: 'stk-op',
    group: 'Border',
  },
}
