import type { UtilityConfig } from '@pandacss/types'

export const display: UtilityConfig = {
  display: {
    className: 'd',
    group: 'Display',
  },

  hideFrom: {
    className: 'hide',
    values: 'breakpoints',
    group: 'Display',
    transform(value, { raw, token }) {
      const bp = token.raw(`breakpoints.${raw}`)
      const media = bp ? `@breakpoint ${raw}` : `@media screen and (min-width: ${value})`
      return {
        [media]: {
          display: 'none',
        },
      }
    },
  },

  hideBelow: {
    className: 'show',
    values: 'breakpoints',
    group: 'Display',
    transform(value, { raw, token }) {
      const bp = token.raw(`breakpoints.${raw}`)
      const media = bp ? `@breakpoint ${raw}Down` : `@media screen and (max-width: ${value})`
      return {
        [media]: {
          display: 'none',
        },
      }
    },
  },
}
