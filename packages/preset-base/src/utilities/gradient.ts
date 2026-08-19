import type { PropertyValues, UtilityConfig } from '@pandacss/types'
import { anyVar, cssVar } from '../css-var'

// Transparent, not black — otherwise `gradientTo` alone fades from opaque.
const stopColor = () => cssVar('<color>', '#0000')
const composed = {
  '--gradient-position': anyVar(),
  '--gradient-stops': anyVar(),
  '--gradient-via-stops': anyVar(),
}
import { createColorMixTransform } from '../color-mix-transform'

const gradientVia = createColorMixTransform('--gradient-via')

const linearGradientDirectionMap = new Map([
  ['to-t', 'to top'],
  ['to-tr', 'to top right'],
  ['to-r', 'to right'],
  ['to-br', 'to bottom right'],
  ['to-b', 'to bottom'],
  ['to-bl', 'to bottom left'],
  ['to-l', 'to left'],
  ['to-tl', 'to top left'],
])

const isGradientShortcut = (value: string) => linearGradientDirectionMap.has(value)

const linearGradientValues: PropertyValues = (theme) => {
  return {
    ...theme('gradients'),
    ...Object.fromEntries(linearGradientDirectionMap.entries()),
  }
}

const gradientStops =
  'var(--gradient-via-stops, var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position))'

const gradientViaStops =
  'var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-via) var(--gradient-via-position), var(--gradient-to) var(--gradient-to-position)'

export const backgroundGradients: UtilityConfig = {
  backgroundGradient: {
    shorthand: 'bgGradient',
    className: 'bg-grad',
    group: 'Background Gradient',
    globalVars: composed,
    values: linearGradientValues,
    transform(value, { raw, token }) {
      const tokenValue = token(`gradients.${raw}`)
      if (tokenValue) {
        return { backgroundImage: tokenValue }
      }

      // If not a known direction shortcut, use the value as-is (with token refs expanded)
      if (!isGradientShortcut(raw)) {
        return { backgroundImage: value }
      }

      return {
        '--gradient-stops': gradientStops,
        '--gradient-position': linearGradientDirectionMap.get(raw),
        backgroundImage: `linear-gradient(var(--gradient-stops))`,
      }
    },
  },

  backgroundLinear: {
    shorthand: 'bgLinear',
    className: 'bg-linear',
    group: 'Background Gradient',
    globalVars: composed,
    values: linearGradientValues,
    transform(value, { raw, token }) {
      const tokenValue = token(`gradients.${raw}`)
      if (tokenValue) {
        return { backgroundImage: tokenValue }
      }

      // If not a known direction shortcut, use the value as-is (with token refs expanded)
      if (!isGradientShortcut(raw)) {
        return { backgroundImage: value }
      }

      return {
        '--gradient-stops': gradientStops,
        '--gradient-position': linearGradientDirectionMap.get(raw),
        backgroundImage: `linear-gradient(var(--gradient-stops))`,
      }
    },
  },

  backgroundRadial: {
    shorthand: 'bgRadial',
    className: 'bg-radial',
    group: 'Background Gradient',
    globalVars: composed,
    values: 'gradients',
    transform(value, { raw, token }) {
      const tokenValue = token(`gradients.${raw}`)
      if (tokenValue) {
        return { backgroundImage: tokenValue }
      }

      return {
        '--gradient-stops': gradientStops,
        '--gradient-position': value,
        backgroundImage: `radial-gradient(var(--gradient-stops,${value}))`,
      }
    },
  },

  backgroundConic: {
    shorthand: 'bgConic',
    className: 'bg-conic',
    group: 'Background Gradient',
    globalVars: composed,
    transform(value) {
      return {
        '--gradient-stops': gradientStops,
        '--gradient-position': value,
        backgroundImage: `conic-gradient(var(--gradient-stops))`,
      }
    },
  },

  textGradient: {
    className: 'txt-grad',
    group: 'Background Gradient',
    globalVars: composed,
    values: linearGradientValues,
    transform(value, { raw, token }) {
      const tokenValue = token(`gradients.${raw}`)
      if (tokenValue) {
        return {
          backgroundImage: tokenValue,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }
      }
      // If not a known direction shortcut, use the value as-is (with token refs expanded)
      if (!isGradientShortcut(raw)) {
        return {
          backgroundImage: value,
          WebkitBackgroundClip: 'text',
          color: 'transparent',
        }
      }
      return {
        '--gradient-stops': gradientStops,
        '--gradient-position': linearGradientDirectionMap.get(raw),
        backgroundImage: `linear-gradient(var(--gradient-stops))`,
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }
    },
  },
  gradientFromPosition: {
    className: 'grad-from-pos',
    group: 'Background Gradient',
    globalVars: { '--gradient-from-position': cssVar('<length-percentage>', '0%') },
    transform(value) {
      return {
        '--gradient-from-position': value,
      }
    },
  },
  gradientToPosition: {
    className: 'grad-to-pos',
    group: 'Background Gradient',
    globalVars: { '--gradient-to-position': cssVar('<length-percentage>', '100%') },
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
    globalVars: { '--gradient-from': stopColor() },
    transform: createColorMixTransform('--gradient-from'),
  },
  gradientTo: {
    className: 'grad-to',
    values: 'colors',
    group: 'Background Gradient',
    globalVars: { '--gradient-to': stopColor() },
    transform: createColorMixTransform('--gradient-to'),
  },
  gradientVia: {
    className: 'grad-via',
    values: 'colors',
    group: 'Background Gradient',
    globalVars: { '--gradient-via': stopColor() },
    transform(value, args) {
      const transformed = gradientVia(value, args)
      return {
        ...transformed,
        '--gradient-stops': 'var(--gradient-via-stops)',
        '--gradient-via-stops': gradientViaStops,
      }
    },
  },
  gradientViaPosition: {
    className: 'grad-via-pos',
    group: 'Background Gradient',
    globalVars: { '--gradient-via-position': cssVar('<length-percentage>', '50%') },
    transform(value) {
      return {
        '--gradient-via-position': value,
      }
    },
  },
}
