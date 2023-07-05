import type { UtilityConfig } from '@pandacss/types'

const positiveFractions = {
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  full: '100%',
}
const negativeFractions = Object.fromEntries(
  Object.entries(positiveFractions).map(([key, value]) => [`-${key}`, `-${value}`]),
)
const fractions = { ...positiveFractions, ...negativeFractions }

export const transforms: UtilityConfig = {
  transformOrigin: {
    className: 'origin',
  },
  scale: {
    className: 'scale',
    property: 'scale',
    values: {
      auto: 'var(--scale-x) var(--scale-y)',
    },
  },
  scaleX: {
    className: 'scale-x',
    transform(value) {
      return {
        '--scale-x': value,
      }
    },
  },
  scaleY: {
    className: 'scale-y',
    transform(value) {
      return {
        '--scale-y': value,
      }
    },
  },
  translate: {
    className: 'translate',
    property: 'translate',
    values: {
      auto: 'var(--translate-x) var(--translate-y)',
    },
  },
  translateX: {
    shorthand: 'x',
    className: 'translate-x',
    values(theme) {
      return {
        ...theme('spacing'),
        ...fractions,
      }
    },
    transform(value) {
      return {
        '--translate-x': value,
      }
    },
  },
  translateY: {
    shorthand: 'y',
    className: 'translate-y',
    values(theme) {
      return {
        ...theme('spacing'),
        ...fractions,
      }
    },
    transform(value) {
      return {
        '--translate-y': value,
      }
    },
  },
}
