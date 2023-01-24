import type { UtilityConfig } from '@pandacss/types'

export const typography: UtilityConfig = {
  color: {
    className: 'text',
    values: 'colors',
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
  },
  textEmphasisColor: {
    className: 'text-emphasis',
    values: 'colors',
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
