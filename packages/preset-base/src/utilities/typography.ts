import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const typography: UtilityConfig = {
  color: {
    className: 'text',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('color'),
  },
  fontFamily: {
    className: 'font',
    values: 'fonts',
    group: 'Typography',
  },
  fontSize: {
    className: 'fs',
    values: 'fontSizes',
    group: 'Typography',
  },
  fontWeight: {
    className: 'font',
    values: 'fontWeights',
    group: 'Typography',
  },
  fontSmoothing: {
    className: 'smoothing',
    group: 'Typography',
    values: {
      antialiased: 'antialiased',
      'subpixel-antialiased': 'auto',
    },
    transform(value) {
      return {
        WebkitFontSmoothing: value,
      }
    },
  },
  fontVariantNumeric: {
    className: 'numeric',
    group: 'Typography',
  },
  letterSpacing: {
    className: 'tracking',
    values: 'letterSpacings',
    group: 'Typography',
  },
  lineHeight: {
    className: 'leading',
    values: 'lineHeights',
    group: 'Typography',
  },
  textAlign: {
    className: 'text',
    group: 'Typography',
  },
  textDecoration: {
    className: 'text-decor',
    group: 'Typography',
  },
  textDecorationColor: {
    className: 'text-decor',
    values: 'colors',
    transform: createColorMixTransform('textDecorationColor'),
    group: 'Typography',
  },
  textEmphasisColor: {
    className: 'text-emphasis',
    values: 'colors',
    transform: createColorMixTransform('textEmphasisColor'),
    group: 'Typography',
  },
  textDecorationStyle: {
    className: 'decoration',
    group: 'Typography',
  },
  textDecorationThickness: {
    className: 'decoration',
    group: 'Typography',
  },
  textUnderlineOffset: {
    className: 'underline-offset',
    group: 'Typography',
  },
  textTransform: {
    className: 'text',
    group: 'Typography',
  },
  textIndent: {
    className: 'indent',
    group: 'Typography',
    values: 'spacing',
  },
  textShadow: {
    className: 'text-shadow',
    values: 'shadows',
    group: 'Typography',
  },
  textShadowColor: {
    shorthand: 'textShadowColor',
    className: 'text-shadow',
    values: 'colors',
    transform: createColorMixTransform('--text-shadow-color'),
    group: 'Typography',
  },
  textOverflow: {
    className: 'text',
    group: 'Typography',
  },
  verticalAlign: {
    className: 'align',
    group: 'Typography',
  },
  wordBreak: {
    className: 'break',
    group: 'Typography',
  },
  textWrap: {
    className: 'text',
    values: ['wrap', 'balance', 'nowrap'],
    group: 'Typography',
    transform(value) {
      return { textWrap: value }
    },
  },
  truncate: {
    className: 'truncate',
    values: { type: 'boolean' },
    group: 'Typography',
    transform(value) {
      if (!value) return {}
      return {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }
    },
  },
  lineClamp: {
    className: 'clamp',
    group: 'Typography',
    transform(value) {
      if (value === 'none') {
        return {
          WebkitLineClamp: 'unset',
        }
      }
      return {
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: value,
        WebkitBoxOrient: 'vertical',
      }
    },
  },
}
