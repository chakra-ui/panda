import type { UtilityConfig } from '@pandacss/types'
import { anyVar, cssVar } from '../css-var'

const length = () => cssVar('<length-percentage>', '0')

// The `rotate` property holds one rotation, so `rotate: 'auto'` composes on `transform`
// instead. Each axis variable holds the whole function, and an unset one contributes
// nothing through the empty `var(--rotate-x,)` fallback.
const ROTATE_AXES = ['x', 'y', 'z'].map((axis) => `var(--rotate-${axis},)`).join(' ')

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
    // `auto-3d` is an alias: an unset axis contributes nothing either way.
    values: { auto: 'auto', 'auto-3d': 'auto' },
    transform(value) {
      return value === 'auto' ? { transform: ROTATE_AXES } : { rotate: value }
    },
  },
  rotateX: {
    className: 'rotate-x',
    group: 'Transform',
    property: 'rotate',
    globalVars: { '--rotate-x': anyVar() },
    transform(value) {
      return {
        '--rotate-x': `rotateX(${value})`,
      }
    },
  },
  rotateY: {
    className: 'rotate-y',
    group: 'Transform',
    property: 'rotate',
    globalVars: { '--rotate-y': anyVar() },
    transform(value) {
      return {
        '--rotate-y': `rotateY(${value})`,
      }
    },
  },
  rotateZ: {
    className: 'rotate-z',
    group: 'Transform',
    property: 'rotate',
    globalVars: { '--rotate-z': anyVar() },
    transform(value) {
      return {
        '--rotate-z': `rotateZ(${value})`,
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
    globalVars: { '--scale-x': anyVar('1') },
    transform(value) {
      return {
        '--scale-x': value,
      }
    },
  },
  scaleY: {
    className: 'scale-y',
    group: 'Transform',
    globalVars: { '--scale-y': anyVar('1') },
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
    globalVars: { '--translate-x': length() },
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
    globalVars: { '--translate-y': length() },
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
    // `<length>`, not `<length-percentage>`: the third slot of `translate` rejects a
    // percentage, and a stray one would take x and y down with it.
    globalVars: { '--translate-z': cssVar('<length>', '0') },
    values(theme) {
      return theme('spacing')
    },
    transform(value) {
      return {
        '--translate-z': value,
      }
    },
  },
}
