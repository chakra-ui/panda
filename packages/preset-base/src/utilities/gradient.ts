import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

const gradientVia = createColorMixTransform('--gradient-via')

const gradientTemplate = {
  'to-t': 'linear-gradient(to top, var(--gradient))',
  'to-tr': 'linear-gradient(to top right, var(--gradient))',
  'to-r': 'linear-gradient(to right, var(--gradient))',
  'to-br': 'linear-gradient(to bottom right, var(--gradient))',
  'to-b': 'linear-gradient(to bottom, var(--gradient))',
  'to-bl': 'linear-gradient(to bottom left, var(--gradient))',
  'to-l': 'linear-gradient(to left, var(--gradient))',
  'to-tl': 'linear-gradient(to top left, var(--gradient))',
}

const gradientVars = {
  '--gradient-stops':
    'var(--gradient-via-stops, var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position))',
  '--gradient': 'var(--gradient-via-stops, var(--gradient-stops))',
}

export const backgroundGradients: UtilityConfig = {
  backgroundGradient: {
    shorthand: 'bgGradient',
    className: 'bg-grad',
    group: 'Background Gradient',
    values(theme) {
      return {
        ...theme('gradients'),
        ...gradientTemplate,
      }
    },
    transform(value) {
      return {
        ...gradientVars,
        backgroundImage: value,
      }
    },
  },
  textGradient: {
    className: 'txt-grad',
    group: 'Background Gradient',
    values(theme) {
      return {
        ...theme('gradients'),
        ...gradientTemplate,
      }
    },
    transform(value) {
      return {
        ...gradientVars,
        backgroundImage: value,
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }
    },
  },
  gradientFromPosition: {
    className: 'grad-from-pos',
    group: 'Background Gradient',
    transform(value) {
      return {
        '--gradient-from-position': value,
      }
    },
  },
  gradientToPosition: {
    className: 'grad-to-pos',
    group: 'Background Gradient',
    transform(value) {
      return {
        '--gradient-to-position': value,
      }
    },
  },
  gradientFrom: {
    className: 'grad-from',
    values: 'colors',
    group: 'Background Gradient',
    transform: createColorMixTransform('--gradient-from'),
  },
  gradientTo: {
    className: 'grad-to',
    values: 'colors',
    group: 'Background Gradient',
    transform: createColorMixTransform('--gradient-to'),
  },
  gradientVia: {
    className: 'grad-via',
    values: 'colors',
    group: 'Background Gradient',
    transform(value, args) {
      const transformed = gradientVia(value, args)
      return {
        ...transformed,
        '--gradient-stops':
          'var(--gradient-from) var(--gradient-from-position), var(--gradient-via) var(--gradient-via-position), var(--gradient-to) var(--gradient-to-position)',
      }
    },
  },
  gradientViaPosition: {
    className: 'grad-via-pos',
    group: 'Background Gradient',
    transform(value) {
      return {
        '--gradient-via-position': value,
      }
    },
  },
}
