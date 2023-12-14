import type { UtilityConfig } from '@pandacss/types'
import MaskCornerCuts from 'open-props/src/masks.corner-cuts'
import MaskEdges from 'open-props/src/masks.edges'
import { camelize } from './utils'
import { noiseFilters } from './gradients'

const masks = Object.fromEntries(
  Object.entries(Object.assign({}, MaskCornerCuts, MaskEdges)).map(([key, value]) => [
    camelize(key.replace('--mask-', '')),
    value,
  ]),
)

export const utilities: UtilityConfig = {
  WebkitMask: {
    values: masks,
    transform(value) {
      return {
        WebkitMask: value,
      }
    },
  },
  filter: {
    className: 'filter',
    values: noiseFilters,
  },
}
