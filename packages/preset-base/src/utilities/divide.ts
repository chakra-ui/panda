import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const divide: UtilityConfig = {
  divideX: {
    className: 'divide-x',
    values: { type: 'string' },
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
    values: { type: 'string' },
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
    className: 'divide',
    values: 'colors',
    transform(value, args) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': divideColor(value, args),
      }
    },
  },
  divideStyle: {
    className: 'divide',
    property: 'borderStyle',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderStyle: value,
        },
      }
    },
  },
}

const divideColor = createColorMixTransform('borderColor')
