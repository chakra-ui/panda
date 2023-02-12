import type { UtilityConfig } from '@pandacss/types'

export const display: UtilityConfig = {
  display: {
    className: 'd',
  },

  hideFrom: {
    className: 'hide',
    values: 'breakpoints',
    transform(value) {
      return {
        [`@breakpoint ${value}`]: {
          display: 'none',
        },
      }
    },
  },

  hideBelow: {
    className: 'show',
    values: 'breakpoints',
    transform(value) {
      return {
        [`@breakpoint ${value}Down`]: {
          display: 'none',
        },
      }
    },
  },
}
