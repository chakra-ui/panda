import type { UtilityConfig } from '@pandacss/types'

export const display: UtilityConfig = {
  display: {
    className: 'd',
  },

  hideFrom: {
    className: 'hide',
    values: 'screens',
    transform(value) {
      return {
        [`@screen ${value}`]: {
          display: 'none',
        },
      }
    },
  },

  hideBelow: {
    className: 'show',
    values: 'screens',
    transform(value) {
      return {
        [`@screen ${value}Down`]: {
          display: 'none',
        },
      }
    },
  },
}
