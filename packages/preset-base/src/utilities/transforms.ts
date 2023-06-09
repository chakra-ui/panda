import type { UtilityConfig } from '@pandacss/types'

const transformTemplate = [
  'rotate(var(--rotate))',
  'scaleX(var(--scale-x))',
  'scaleY(var(--scale-y))',
  'skewX(var(--skew-x))',
  'skewY(var(--skew-y))',
]

export const baseTransformTemplate = [
  'translateX(var(--translate-x))',
  'translateY(var(--translate-y))',
  ...transformTemplate,
].join(' ')

export const gpuTransformTemplate = [
  'translate3d(var(--translate-x), var(--translate-y), 0)',
  ...transformTemplate,
].join(' ')

export const transforms: UtilityConfig = {
  transform: {
    className: 'transform',
    values: {
      auto: baseTransformTemplate,
      'auto-gpu': gpuTransformTemplate,
    },
  },
  transformOrigin: {
    className: 'origin',
  },
  scale: {
    className: 'scale',
    transform(value) {
      return {
        '--scale-x': value,
        '--scale-y': value,
      }
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
  rotate: {
    className: 'rotate',
    transform(value) {
      return {
        '--rotate': value,
      }
    },
  },
  translateX: {
    shorthand: 'x',
    className: 'translate-x',
    values(theme) {
      return {
        ...theme('spacing'),
        '1/2': '50%',
        '1/3': '33.333333%',
        '2/3': '66.666667%',
        '1/4': '25%',
        '2/4': '50%',
        '3/4': '75%',
        full: '100%',
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
        '1/2': '50%',
        '1/3': '33.333333%',
        '2/3': '66.666667%',
        '1/4': '25%',
        '2/4': '50%',
        '3/4': '75%',
        full: '100%',
      }
    },
    transform(value) {
      return {
        '--translate-y': value,
      }
    },
  },
  skewX: {
    className: 'skew-x',
    transform(value) {
      return {
        '--skew-x': value,
      }
    },
  },
  skewY: {
    className: 'skew-y',
    transform(value) {
      return {
        '--skew-y': value,
      }
    },
  },
}
