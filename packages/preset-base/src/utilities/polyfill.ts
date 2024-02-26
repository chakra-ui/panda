import type { UtilityConfig } from '@pandacss/types'

export const polyfill: UtilityConfig = {
  appearance: {
    className: 'appearance',
    group: 'Visibility',
    transform(value) {
      return { appearance: value, WebkitAppearance: value }
    },
  },
  backfaceVisibility: {
    className: 'backface',
    group: 'Visibility',
    transform(value) {
      return { backfaceVisibility: value, WebkitBackfaceVisibility: value }
    },
  },
  clipPath: {
    className: 'clip-path',
    group: 'Other Style Props',
    transform(value) {
      return { clipPath: value, WebkitClipPath: value }
    },
  },
  hyphens: {
    className: 'hyphens',
    group: 'Other Style Props',
    transform(value) {
      return { hyphens: value, WebkitHyphens: value }
    },
  },
  mask: {
    className: 'mask',
    group: 'Other Style Props',
    transform(value) {
      return { mask: value, WebkitMask: value }
    },
  },
  maskImage: {
    className: 'mask-image',
    group: 'Other Style Props',
    transform(value) {
      return { maskImage: value, WebkitMaskImage: value }
    },
  },
  maskSize: {
    className: 'mask-size',
    group: 'Other Style Props',
    transform(value) {
      return { maskSize: value, WebkitMaskSize: value }
    },
  },
  textSizeAdjust: {
    className: 'text-size-adjust',
    group: 'Typography',
    transform(value) {
      return { textSizeAdjust: value, WebkitTextSizeAdjust: value }
    },
  },
}
