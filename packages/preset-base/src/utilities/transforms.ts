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
    className: 'trf-o',
    group: 'Transform',
  },
  transformBox: {
    className: 'trf-b',
    group: 'Transform',
  },
  transformStyle: {
    className: 'trf-s',
    group: 'Transform',
  },
  transform: {
    className: 'trf',
    group: 'Transform',
  },
  rotate: {
    className: 'rotate',
    group: 'Transform',
    property: 'rotate',
    values: {
      auto: 'var(--rotate-x) var(--rotate-y)',
      'auto-3d': 'var(--rotate-x) var(--rotate-y) var(--rotate-z)',
    },
  },
  rotateX: {
    className: 'rotate-x',
    group: 'Transform',
    property: 'rotate',
    transform(value) {
      return {
        '--rotate-x': value,
      }
    },
  },
  rotateY: {
    className: 'rotate-y',
    group: 'Transform',
    property: 'rotate',
    transform(value) {
      return {
        '--rotate-y': value,
      }
    },
  },
  rotateZ: {
    className: 'rotate-z',
    group: 'Transform',
    property: 'rotate',
    transform(value) {
      return {
        '--rotate-z': value,
      }
    },
  },
  scale: {
    className: 'scale',
    group: 'Transform',
    property: 'scale',
    values: {
      auto: 'var(--scale-x) var(--scale-y)',
    },
  },
  scaleX: {
    className: 'scale-x',
    group: 'Transform',
    transform(value) {
      return {
        '--scale-x': value,
      }
    },
  },
  scaleY: {
    className: 'scale-y',
    group: 'Transform',
    transform(value) {
      return {
        '--scale-y': value,
      }
    },
  },
  translate: {
    className: 'translate',
    group: 'Transform',
    property: 'translate',
    values: {
      auto: 'var(--translate-x) var(--translate-y)',
      'auto-3d': 'var(--translate-x) var(--translate-y) var(--translate-z)',
    },
  },
  translateX: {
    shorthand: 'x',
    className: 'translate-x',
    group: 'Transform',
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
    group: 'Transform',
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
  translateZ: {
    shorthand: 'z',
    className: 'translate-z',
    group: 'Transform',
    values(theme) {
      return {
        ...theme('spacing'),
        ...fractions,
      }
    },
    transform(value) {
      return {
        '--translate-z': value,
      }
    },
  },
}
