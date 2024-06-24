import type { UtilityConfig, PropertyValues } from '@pandacss/types'

const marginValues: PropertyValues = (theme) => ({
  auto: 'auto',
  ...theme('spacing'),
})

export const spacing: UtilityConfig = {
  padding: {
    className: 'p',
    shorthand: 'p',
    values: 'spacing',
    group: 'Padding',
  },
  paddingLeft: {
    className: 'pl',
    shorthand: 'pl',
    values: 'spacing',
    group: 'Padding',
  },
  paddingRight: {
    className: 'pr',
    shorthand: 'pr',
    values: 'spacing',
    group: 'Padding',
  },
  paddingTop: {
    className: 'pt',
    shorthand: 'pt',
    values: 'spacing',
    group: 'Padding',
  },
  paddingBottom: {
    className: 'pb',
    shorthand: 'pb',
    values: 'spacing',
    group: 'Padding',
  },
  paddingBlock: {
    className: 'py',
    values: 'spacing',
    group: 'Padding',
    shorthand: ['py', 'paddingY'],
  },
  paddingBlockEnd: {
    className: 'pbe',
    values: 'spacing',
    group: 'Padding',
  },
  paddingBlockStart: {
    className: 'p-bs',
    values: 'spacing',
    group: 'Padding',
  },
  paddingInline: {
    className: 'px',
    values: 'spacing',
    group: 'Padding',
    shorthand: ['paddingX', 'px'],
  },
  paddingInlineEnd: {
    className: 'pe',
    shorthand: ['pe', 'paddingEnd'],
    values: 'spacing',
    group: 'Padding',
  },
  paddingInlineStart: {
    className: 'ps',
    shorthand: ['ps', 'paddingStart'],
    values: 'spacing',
    group: 'Padding',
  },

  marginLeft: {
    className: 'ml',
    shorthand: 'ml',
    values: marginValues,
    group: 'Margin',
  },
  marginRight: {
    className: 'mr',
    shorthand: 'mr',
    values: marginValues,
    group: 'Margin',
  },
  marginTop: {
    className: 'mt',
    shorthand: 'mt',
    values: marginValues,
    group: 'Margin',
  },
  marginBottom: {
    className: 'mb',
    shorthand: 'mb',
    values: marginValues,
    group: 'Margin',
  },
  margin: {
    className: 'm',
    shorthand: 'm',
    values: marginValues,
    group: 'Margin',
  },
  marginBlock: {
    className: 'my',
    values: marginValues,
    group: 'Margin',
    shorthand: ['my', 'marginY'],
  },
  marginBlockEnd: {
    className: 'mbe',
    values: marginValues,
    group: 'Margin',
  },
  marginBlockStart: {
    className: 'mts',
    values: marginValues,
    group: 'Margin',
  },
  marginInline: {
    className: 'mx',
    values: marginValues,
    group: 'Margin',
    shorthand: ['mx', 'marginX'],
  },
  marginInlineEnd: {
    className: 'me',
    shorthand: ['me', 'marginEnd'],
    values: marginValues,
    group: 'Margin',
  },
  marginInlineStart: {
    className: 'ms',
    shorthand: ['ms', 'marginStart'],
    values: marginValues,
    group: 'Margin',
  },
  spaceX: {
    className: 'space-x',
    values: marginValues,
    property: 'marginInlineStart',
    group: 'Margin',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          marginInlineStart: value,
          marginInlineEnd: '0px',
        },
      }
    },
  },
  spaceY: {
    className: 'space-y',
    values: marginValues,
    property: 'marginBlockStart',
    group: 'Margin',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          marginTop: value,
          marginBottom: '0px',
        },
      }
    },
  },
}
