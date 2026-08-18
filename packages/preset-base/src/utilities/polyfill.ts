import type { UtilityConfig } from '@pandacss/types'

export const polyfill: UtilityConfig = {
  appearance: {
    className: 'ap',
    group: 'Visibility',
    transform(value) {
      return { WebkitAppearance: value, appearance: value }
    },
  },
  backfaceVisibility: {
    className: 'bfv',
    group: 'Visibility',
    transform(value) {
      return { WebkitBackfaceVisibility: value, backfaceVisibility: value }
    },
  },
  clipPath: {
    className: 'cp-path',
    group: 'Other',
    transform(value) {
      return { WebkitClipPath: value, clipPath: value }
    },
  },
  hyphens: {
    className: 'hy',
    group: 'Other',
    transform(value) {
      return { WebkitHyphens: value, hyphens: value }
    },
  },
  textSizeAdjust: {
    className: 'txt-adj',
    group: 'Typography',
    transform(value) {
      return { WebkitTextSizeAdjust: value, textSizeAdjust: value }
    },
  },
}
