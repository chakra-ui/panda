import type { UtilityConfig } from '@pandacss/types'

export const display: UtilityConfig = {
  display: {
    className: 'd',
  },

  hideFrom: {
    className: 'hide',
    values: 'breakpoints',
    transform(value, { raw }) {
      return {
        [`@breakpoint ${raw}`]: {
          display: 'none',
        },
      }
    },
  },

  hideBelow: {
    className: 'show',
    values: 'breakpoints',
    transform(value, { raw }) {
      return {
        [`@breakpoint ${raw}Down`]: {
          display: 'none',
        },
      }
    },
  },
}
