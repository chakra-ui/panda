import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const background: UtilityConfig = {
  backgroundPosition: {
    shorthand: 'bgPosition',
    className: 'bg',
    group: 'Background',
  },
  backgroundPositionX: {
    shorthand: 'bgPositionX',
    className: 'bg-x',
    group: 'Background',
  },
  backgroundPositionY: {
    shorthand: 'bgPositionY',
    className: 'bg-y',
    group: 'Background',
  },

  backgroundAttachment: {
    shorthand: 'bgAttachment',
    className: 'bg',
    group: 'Background',
  },
  backgroundClip: {
    shorthand: 'bgClip',
    className: 'bg-clip',
    group: 'Background',
    transform(value) {
      return {
        backgroundClip: value,
        WebkitBackgroundClip: value,
      }
    },
  },
  background: {
    shorthand: 'bg',
    className: 'bg',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('background'),
  },
  backgroundColor: {
    shorthand: 'bgColor',
    className: 'bg',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('backgroundColor'),
  },

  backgroundOrigin: {
    shorthand: 'bgOrigin',
    className: 'bg-origin',
    group: 'Background',
  },
  backgroundImage: {
    shorthand: 'bgImage',
    className: 'bg-img',
    values: 'assets',
    group: 'Background',
  },
  backgroundRepeat: {
    shorthand: 'bgRepeat',
    className: 'bg-repeat',
    group: 'Background',
  },
  backgroundBlendMode: {
    shorthand: 'bgBlendMode',
    className: 'bg-blend',
    group: 'Background',
  },
  backgroundSize: {
    shorthand: 'bgSize',
    className: 'bg',
    group: 'Background',
  },
  backgroundGradient: {
    shorthand: 'bgGradient',
    className: 'bg-gradient',
    group: 'Background',
    values(theme) {
      return {
        ...theme('gradients'),
        'to-t': 'linear-gradient(to top, var(--gradient))',
        'to-tr': 'linear-gradient(to top right, var(--gradient))',
        'to-r': 'linear-gradient(to right, var(--gradient))',
        'to-br': 'linear-gradient(to bottom right, var(--gradient))',
        'to-b': 'linear-gradient(to bottom, var(--gradient))',
        'to-bl': 'linear-gradient(to bottom left, var(--gradient))',
        'to-l': 'linear-gradient(to left, var(--gradient))',
        'to-tl': 'linear-gradient(to top left, var(--gradient))',
      }
    },
    transform(value) {
      return {
        '--gradient-stops': 'var(--gradient-from), var(--gradient-to)',
        '--gradient': 'var(--gradient-via-stops, var(--gradient-stops))',
        backgroundImage: value,
      }
    },
  },
  textGradient: {
    className: 'text-gradient',
    group: 'Background',
    values(theme) {
      return {
        ...theme('gradients'),
        'to-t': 'linear-gradient(to top, var(--gradient))',
        'to-tr': 'linear-gradient(to top right, var(--gradient))',
        'to-r': 'linear-gradient(to right, var(--gradient))',
        'to-br': 'linear-gradient(to bottom right, var(--gradient))',
        'to-b': 'linear-gradient(to bottom, var(--gradient))',
        'to-bl': 'linear-gradient(to bottom left, var(--gradient))',
        'to-l': 'linear-gradient(to left, var(--gradient))',
        'to-tl': 'linear-gradient(to top left, var(--gradient))',
      }
    },
    transform(value) {
      return {
        '--gradient-stops': 'var(--gradient-from), var(--gradient-to)',
        '--gradient': 'var(--gradient-via-stops, var(--gradient-stops))',
        backgroundImage: value,
        WebkitBackgroundClip: 'text',
        color: 'transparent',
      }
    },
  },
  gradientFrom: {
    className: 'from',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('--gradient-from'),
  },
  gradientTo: {
    className: 'to',
    values: 'colors',
    group: 'Background',
    transform: createColorMixTransform('--gradient-to'),
  },
  gradientVia: {
    className: 'via',
    values: 'colors',
    group: 'Background',
    transform(value, args) {
      const transformed = gradientVia(value, args)
      return {
        ...transformed,
        '--gradient-via-stops': 'var(--gradient-from), var(--gradient-via), var(--gradient-to)',
      }
    },
  },
}

const gradientVia = createColorMixTransform('--gradient-via')
