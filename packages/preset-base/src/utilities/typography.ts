import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const typography: UtilityConfig = {
  color: {
    className: 'c',
    values: 'colors',
    group: 'Color',
    transform: createColorMixTransform('color'),
  },
  fontFamily: {
    className: 'ff',
    values: 'fonts',
    group: 'Typography',
  },
  fontSize: {
    className: 'fs',
    values: 'fontSizes',
    group: 'Typography',
  },
  fontSizeAdjust: {
    className: 'fs-a',
    group: 'Typography',
  },
  fontPalette: {
    className: 'fp',
    group: 'Typography',
  },
  fontKerning: {
    className: 'fk',
    group: 'Typography',
  },
  fontFeatureSettings: {
    className: 'ff-s',
    group: 'Typography',
  },
  fontWeight: {
    className: 'fw',
    values: 'fontWeights',
    group: 'Typography',
  },
  fontSmoothing: {
    className: 'fsmt',
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
  fontVariant: {
    className: 'fv',
    group: 'Typography',
  },
  fontVariantAlternates: {
    className: 'fv-alt',
    group: 'Typography',
  },
  fontVariantCaps: {
    className: 'fv-caps',
    group: 'Typography',
  },
  fontVariationSettings: {
    className: 'fv-s',
    group: 'Typography',
  },
  fontVariantNumeric: {
    className: 'fv-num',
    group: 'Typography',
  },
  letterSpacing: {
    className: 'ls',
    values: 'letterSpacings',
    group: 'Typography',
  },
  lineHeight: {
    className: 'lh',
    values: 'lineHeights',
    group: 'Typography',
  },
  textAlign: {
    className: 'ta',
    group: 'Typography',
  },
  textDecoration: {
    className: 'td',
    group: 'Typography',
  },
  textDecorationColor: {
    className: 'td-c',
    values: 'colors',
    transform: createColorMixTransform('textDecorationColor'),
    group: 'Typography',
  },
  textEmphasisColor: {
    className: 'te-c',
    values: 'colors',
    transform: createColorMixTransform('textEmphasisColor'),
    group: 'Typography',
  },
  textDecorationStyle: {
    className: 'td-s',
    group: 'Typography',
  },
  textDecorationThickness: {
    className: 'td-t',
    group: 'Typography',
  },
  textUnderlineOffset: {
    className: 'tu-o',
    group: 'Typography',
  },
  textTransform: {
    className: 'tt',
    group: 'Typography',
  },
  textIndent: {
    className: 'ti',
    group: 'Typography',
    values: 'spacing',
  },
  textShadow: {
    className: 'tsh',
    values: 'shadows',
    group: 'Typography',
  },
  textShadowColor: {
    shorthand: 'textShadowColor',
    className: 'tsh-c',
    values: 'colors',
    transform: createColorMixTransform('--text-shadow-color'),
    group: 'Typography',
  },
  textOverflow: {
    className: 'tov',
    group: 'Typography',
  },
  verticalAlign: {
    className: 'va',
    group: 'Typography',
  },
  wordBreak: {
    className: 'wb',
    group: 'Typography',
  },
  textWrap: {
    className: 'tw',
    values: ['wrap', 'balance', 'nowrap'],
    group: 'Typography',
    transform(value) {
      return { textWrap: value }
    },
  },
  truncate: {
    className: 'trunc',
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
    className: 'lc',
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
