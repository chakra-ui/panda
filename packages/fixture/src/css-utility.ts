import { UtilityConfig } from '@css-panda/types'

export const utilities: UtilityConfig = {
  properties: {
    background: {
      className: 'bg',
      values: 'colors',
    },
    color: {
      className: 'text',
      values: 'colors',
    },
    aspectRatio: {
      className: 'aspect',
      values: {
        auto: 'auto',
        square: '1 / 1',
        video: '16 / 9',
      },
    },
    flexBasis: {
      className: 'basis',
      values: {
        '0': '0',
        '1/2': '50%',
        '1/3': '33.333333%',
        '2/3': '66.666667%',
        '1/4': '25%',
      },
    },
    flex: {
      className: 'flex',
      values: {
        '1': '1 1 0%',
        auto: '1 1 auto',
        initial: '0 1 auto',
        none: 'none',
      },
    },
    fontWeight: {
      className: 'fw',
      values: 'fontWeights',
    },
    letterSpacing: {
      className: 'tracking',
      values: 'letterSpacings',
    },
    width: {
      className: 'w',
      values(theme) {
        return {
          ...theme('spacing'),
          '1/2': '50%',
          '1/3': '33.333333%',
          '2/3': '66.666667%',
          '1/4': '25%',
          '2/4': '50%',
        }
      },
    },
    maxWidth: {
      className: 'max-w',
      values: 'largeSizes',
    },
    marginLeft: {
      className: 'ml',
      values: 'spacing',
    },
    marginRight: {
      className: 'mr',
      values: 'spacing',
    },
    marginTop: {
      className: 'mt',
      values: 'spacing',
    },
    marginBottom: {
      className: 'mb',
      values: 'spacing',
    },
  },
}
