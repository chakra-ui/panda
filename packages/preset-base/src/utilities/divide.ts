import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

const divideColor = createColorMixTransform('borderColor')

export const divide: UtilityConfig = {
  divideX: {
    className: 'divide-x',
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
    className: 'divide-y',
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
    className: 'divide-color',
    values: 'colors',
    group: 'Border',
    transform(value, args) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': divideColor(value, args),
      }
    },
  },
  divideStyle: {
    className: 'divide-style',
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
