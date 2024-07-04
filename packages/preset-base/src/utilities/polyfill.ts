import type { UtilityConfig } from '@pandacss/types'

export const polyfill: UtilityConfig = {
  appearance: {
    className: 'ap',
    group: 'Visibility',
    transform(value) {
      return { appearance: value, WebkitAppearance: value }
    },
  },
  backfaceVisibility: {
    className: 'bfv',
    group: 'Visibility',
    transform(value) {
      return { backfaceVisibility: value, WebkitBackfaceVisibility: value }
    },
  },
  clipPath: {
    className: 'cp-path',
    group: 'Other',
    transform(value) {
      return { clipPath: value, WebkitClipPath: value }
    },
  },
  hyphens: {
    className: 'hy',
    group: 'Other',
    transform(value) {
      return { hyphens: value, WebkitHyphens: value }
    },
  },
  mask: {
    className: 'msk',
    group: 'Other',
    transform(value) {
      return { mask: value, WebkitMask: value }
    },
  },
  maskImage: {
    className: 'msk-i',
    group: 'Other',
    transform(value) {
      return { maskImage: value, WebkitMaskImage: value }
    },
  },
  maskSize: {
    className: 'msk-s',
    group: 'Other',
    transform(value) {
      return { maskSize: value, WebkitMaskSize: value }
    },
  },
  textSizeAdjust: {
    className: 'txt-adj',
    group: 'Typography',
    transform(value) {
      return { textSizeAdjust: value, WebkitTextSizeAdjust: value }
    },
  },
}
