import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const effects: UtilityConfig = {
  opacity: {
    values: 'opacity',
    group: 'Background',
  },
  boxShadow: {
    shorthand: 'shadow',
    className: 'shadow',
    values: 'shadows',
    group: 'Shadow',
  },
  boxShadowColor: {
    shorthand: 'shadowColor',
    className: 'shadow',
    values: 'colors',
    transform: createColorMixTransform('--shadow-color'),
    group: 'Color',
  },
  mixBlendMode: {
    className: 'mix-blend',
    group: 'Effect',
  },
  filter: {
    className: 'filter',
    group: 'Effect',
    values: {
      auto: [
        'var(--blur)',
        'var(--brightness)',
        'var(--contrast)',
        'var(--grayscale)',
        'var(--hue-rotate)',
        'var(--invert)',
        'var(--saturate)',
        'var(--sepia)',
        'var(--drop-shadow)',
      ].join(' '),
    },
  },
  brightness: {
    className: 'brightness',
    group: 'Effect',
    transform(value) {
      return {
        '--brightness': `brightness(${value})`,
      }
    },
  },
  contrast: {
    className: 'contrast',
    group: 'Effect',
    transform(value) {
      return {
        '--contrast': `contrast(${value})`,
      }
    },
  },
  grayscale: {
    className: 'grayscale',
    group: 'Effect',
    transform(value) {
      return {
        '--grayscale': `grayscale(${value})`,
      }
    },
  },
  hueRotate: {
    className: 'hue-rotate',
    group: 'Effect',
    transform(value) {
      return {
        '--hue-rotate': `hue-rotate(${value})`,
      }
    },
  },
  invert: {
    className: 'invert',
    group: 'Effect',
    transform(value) {
      return {
        '--invert': `invert(${value})`,
      }
    },
  },
  saturate: {
    className: 'saturate',
    group: 'Effect',
    transform(value) {
      return {
        '--saturate': `saturate(${value})`,
      }
    },
  },
  sepia: {
    className: 'sepia',
    group: 'Effect',
    transform(value) {
      return {
        '--sepia': `sepia(${value})`,
      }
    },
  },
  dropShadow: {
    className: 'drop-shadow',
    group: 'Effect',
    values: 'dropShadows',
    transform(value) {
      return {
        '--drop-shadow': value,
      }
    },
  },
  blur: {
    className: 'blur',
    group: 'Effect',
    values: 'blurs',
    transform(value) {
      return {
        '--blur': `blur(${value})`,
      }
    },
  },

  backdropFilter: {
    className: 'backdrop',
    group: 'Effect',
    values: {
      auto: [
        'var(--backdrop-blur)',
        'var(--backdrop-brightness)',
        'var(--backdrop-contrast)',
        'var(--backdrop-grayscale)',
        'var(--backdrop-hue-rotate)',
        'var(--backdrop-invert)',
        'var(--backdrop-saturate)',
        'var(--backdrop-sepia)',
      ].join(' '),
    },
    transform(value) {
      return {
        backdropFilter: value,
        WebkitBackdropFilter: value,
      }
    },
  },
  backdropBlur: {
    className: 'backdrop-blur',
    group: 'Effect',
    values: 'blurs',
    transform(value) {
      return {
        '--backdrop-blur': `blur(${value})`,
      }
    },
  },
  backdropBrightness: {
    className: 'backdrop-brightness',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-brightness': `brightness(${value})`,
      }
    },
  },
  backdropContrast: {
    className: 'backdrop-contrast',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-contrast': `contrast(${value})`,
      }
    },
  },
  backdropGrayscale: {
    className: 'backdrop-grayscale',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-grayscale': `grayscale(${value})`,
      }
    },
  },
  backdropHueRotate: {
    className: 'backdrop-hue-rotate',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-hue-rotate': `hue-rotate(${value})`,
      }
    },
  },
  backdropInvert: {
    className: 'backdrop-invert',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-invert': `invert(${value})`,
      }
    },
  },
  backdropOpacity: {
    className: 'backdrop-opacity',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-opacity': value,
      }
    },
  },
  backdropSaturate: {
    className: 'backdrop-saturate',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-saturate': `saturate(${value})`,
      }
    },
  },
  backdropSepia: {
    className: 'backdrop-sepia',
    group: 'Effect',
    transform(value) {
      return {
        '--backdrop-sepia': `sepia(${value})`,
      }
    },
  },
}
