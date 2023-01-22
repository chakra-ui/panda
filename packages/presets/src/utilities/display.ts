import type { UtilityConfig } from '@pandacss/types'

export const display: UtilityConfig = {
  display: {
    className: 'd',
    transform(value) {
      return {
        display: value,
        '--display': value,
      }
    },
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

  showFrom: {
    className: 'show',
    values: 'screens',
    transform(value) {
      return {
        [`@screen ${value}`]: {
          display: 'var(--display)',
        },
      }
    },
  },
}
