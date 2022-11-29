import type { UtilityConfig } from '@pandacss/types'

export const background: UtilityConfig = {
  backgroundAttachment: {
    shorthand: 'bgAttachment',
    className: 'bg',
  },
  backgroundClip: {
    shorthand: 'bgClip',
    className: 'bg-clip',
  },
  background: {
    shorthand: 'bg',
    className: 'bg',
    values: 'colors',
  },
  backgroundColor: {
    shorthand: 'bgColor',
    className: 'bg',
    values: 'colors',
  },
  backgroundPosition: {
    shorthand: 'bgPos',
    className: 'bg',
  },
  backgroundOrigin: {
    shorthand: 'bgOrigin',
    className: 'bg-origin',
  },
  backgroundImage: {
    shorthand: 'bgImage',
    className: 'bg-img',
  },
  backgroundRepeat: {
    shorthand: 'bgRepeat',
    className: 'bg-repeat',
  },
  backgroundBlendMode: {
    shorthand: 'bgBlend',
    className: 'bg-blend',
  },
  backgroundSize: {
    shorthand: 'bgSize',
    className: 'bg',
  },
  backgroundGradient: {
    shorthand: 'bgGradient',
    className: 'bg-gradient',
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
        backgroundClip: 'text',
        color: 'transparent',
      }
    },
  },
  gradientFrom: {
    className: 'from',
    values: 'colors',
    transform(value) {
      return {
        '--gradient-from': value,
      }
    },
  },
  gradientTo: {
    className: 'to',
    values: 'colors',
    transform(value) {
      return {
        '--gradient-to': value,
      }
    },
  },
  gradientVia: {
    className: 'via',
    values: 'colors',
    transform(value) {
      return {
        '--gradient-via-stops': 'var(--gradient-from), var(--gradient-via), var(--gradient-to)',
        '--gradient-via': value,
      }
    },
  },
}
