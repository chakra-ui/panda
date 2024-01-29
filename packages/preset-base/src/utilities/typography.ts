import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const typography: UtilityConfig = {
  color: {
    className: 'text',
    values: 'colors',
    transform: createColorMixTransform('color'),
  },
  fontFamily: {
    className: 'font',
    values: 'fonts',
  },
  fontSize: {
    className: 'fs',
    values: 'fontSizes',
  },
  fontWeight: {
    className: 'font',
    values: 'fontWeights',
  },
  fontSmoothing: {
    className: 'smoothing',
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
  },
  letterSpacing: {
    className: 'tracking',
    values: 'letterSpacings',
  },
  lineHeight: {
    className: 'leading',
    values: 'lineHeights',
  },
  textAlign: {
    className: 'text',
  },
  textDecoration: {
    className: 'text-decor',
  },
  textDecorationColor: {
    className: 'text-decor',
    values: 'colors',
    transform: createColorMixTransform('textDecorationColor'),
  },
  textEmphasisColor: {
    className: 'text-emphasis',
    values: 'colors',
    transform: createColorMixTransform('textEmphasisColor'),
  },
  textDecorationStyle: {
    className: 'decoration',
  },
  textDecorationThickness: {
    className: 'decoration',
  },
  textUnderlineOffset: {
    className: 'underline-offset',
  },
  textTransform: {
    className: 'text',
  },
  textIndent: {
    className: 'indent',
    values: 'spacing',
  },
  textShadow: {
    className: 'text-shadow',
    values: 'shadows',
  },
  textOverflow: {
    className: 'text',
  },
  verticalAlign: {
    className: 'align',
  },
  wordBreak: {
    className: 'break',
  },
  textWrap: {
    className: 'text',
    values: ['wrap', 'balance', 'nowrap'],
    transform(value) {
      return { textWrap: value }
    },
  },
  truncate: {
    className: 'truncate',
    values: { type: 'boolean' },
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
