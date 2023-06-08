import type { UtilityConfig } from '@pandacss/types'

export const effects: UtilityConfig = {
  boxShadow: {
    shorthand: 'shadow',
    className: 'shadow',
    values: 'shadows',
  },
  boxShadowColor: {
    shorthand: 'shadowColor',
    className: 'shadow',
    values: 'colors',
    transform(value) {
      return {
        '--shadow-color': value,
      }
    },
  },
  mixBlendMode: {
    className: 'mix-blend',
  },
  filter: {
    className: 'filter',
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
    transform(value) {
      return {
        '--brightness': `brightness(${value})`,
      }
    },
  },
  contrast: {
    className: 'contrast',
    transform(value) {
      return {
        '--contrast': `constrast(${value})`,
      }
    },
  },
  grayscale: {
    className: 'grayscale',
    transform(value) {
      return {
        '--grayscale': `grayscale(${value})`,
      }
    },
  },
  hueRotate: {
    className: 'hue-rotate',
    transform(value) {
      return {
        '--hue-rotate': `hue-rotate(${value})`,
      }
    },
  },
  invert: {
    className: 'invert',
    transform(value) {
      return {
        '--invert': `invert(${value})`,
      }
    },
  },
  saturate: {
    className: 'saturate',
    transform(value) {
      return {
        '--saturate': `saturate(${value})`,
      }
    },
  },
  sepia: {
    className: 'sepia',
    transform(value) {
      return {
        '--sepia': `sepia(${value})`,
      }
    },
  },
  dropShadow: {
    className: 'drop-shadow',
    values: 'dropShadows',
    transform(value) {
      return {
        '--drop-shadow': value,
      }
    },
  },
  blur: {
    className: 'blur',
    values: 'blurs',
    transform(value) {
      return {
        '--blur': `blur(${value})`,
      }
    },
  },

  backdropFilter: {
    className: 'backdrop',
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
  },
  backdropBlur: {
    className: 'backdrop-blur',
    values: 'blurs',
    transform(value) {
      return {
        '--backdrop-blur': `blur(${value})`,
      }
    },
  },
  backdropBrightness: {
    className: 'backdrop-brightness',
    transform(value) {
      return {
        '--backdrop-brightness': `brightness(${value})`,
      }
    },
  },
  backdropContrast: {
    className: 'backdrop-contrast',
    transform(value) {
      return {
        '--backdrop-contrast': `constrast(${value})`,
      }
    },
  },
  backdropGrayscale: {
    className: 'backdrop-grayscale',
    transform(value) {
      return {
        '--backdrop-grayscale': `grayscale(${value})`,
      }
    },
  },
  backdropHueRotate: {
    className: 'backdrop-hue-rotate',
    transform(value) {
      return {
        '--backdrop-hue-rotate': `hue-rotate(${value})`,
      }
    },
  },
  backdropInvert: {
    className: 'backdrop-invert',
    transform(value) {
      return {
        '--backdrop-invert': `invert(${value})`,
      }
    },
  },
  backdropOpacity: {
    className: 'backdrop-opacity',
    transform(value) {
      return {
        '--backdrop-opacity': value,
      }
    },
  },
  backdropSaturate: {
    className: 'backdrop-saturate',
    transform(value) {
      return {
        '--backdrop-saturate': `saturate(${value})`,
      }
    },
  },
  backdropSepia: {
    className: 'backdrop-sepia',
    transform(value) {
      return {
        '--backdrop-sepia': `sepia(${value})`,
      }
    },
  },
}
