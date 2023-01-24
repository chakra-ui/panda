import type { UtilityConfig } from '@pandacss/types'

export const divide: UtilityConfig = {
  divideX: {
    className: 'divide-x',
    values: { type: 'string' },
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderLeftWidth: value,
          borderRightWidth: '0px',
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
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderColor: value,
        },
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
