import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

const divideColor = createColorMixTransform('borderColor')

export const divide: UtilityConfig = {
  divideX: {
    className: 'dvd-x',
    values: 'borderWidths',
    group: 'Border',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderInlineStartWidth: value,
          borderInlineEndWidth: '0px',
        },
      }
    },
  },
  divideY: {
    className: 'dvd-y',
    values: 'borderWidths',
    group: 'Border',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderTopWidth: value,
          borderBottomWidth: '0px',
        },
      }
    },
  },
  divideColor: {
    className: 'dvd-c',
    values: 'colors',
    group: 'Border',
    transform(value, args) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': divideColor(value, args),
      }
    },
  },
  divideStyle: {
    className: 'dvd-s',
    property: 'borderStyle',
    group: 'Border',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderStyle: value,
        },
      }
    },
  },
}
