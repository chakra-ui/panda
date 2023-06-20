import type { UtilityConfig } from '@pandacss/types'

export const polyfill: UtilityConfig = {
  appearance: {
    className: 'appearance',
    transform(value) {
      return { appearance: value, WebkitAppearance: value }
    },
  },
  backfaceVisibility: {
    className: 'backface',
    transform(value) {
      return { backfaceVisibility: value, WebkitBackfaceVisibility: value }
    },
  },
  clipPath: {
    className: 'clip-path',
    transform(value) {
      return { clipPath: value, WebkitClipPath: value }
    },
  },
  hyphens: {
    className: 'hyphens',
    transform(value) {
      return { hyphens: value, WebkitHyphens: value }
    },
  },
  mask: {
    className: 'mask',
    transform(value) {
      return { mask: value, WebkitMask: value }
    },
  },
  maskImage: {
    className: 'mask-image',
    transform(value) {
      return { maskImage: value, WebkitMaskImage: value }
    },
  },
  maskSize: {
    className: 'mask-size',
    transform(value) {
      return { maskSize: value, WebkitMaskSize: value }
    },
  },
  textSizeAdjust: {
    className: 'text-size-adjust',
    transform(value) {
      return { textSizeAdjust: value, WebkitTextSizeAdjust: value }
    },
  },
}
