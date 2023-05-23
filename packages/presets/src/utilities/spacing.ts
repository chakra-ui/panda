import type { UtilityConfig } from '@pandacss/types'

export const spacing: UtilityConfig = {
  padding: {
    className: 'p',
    shorthand: 'p',
    values: 'spacing',
  },
  paddingLeft: {
    className: 'pl',
    shorthand: 'pl',
    values: 'spacing',
  },
  paddingRight: {
    className: 'pr',
    shorthand: 'pr',
    values: 'spacing',
  },
  paddingTop: {
    className: 'pt',
    shorthand: 'pt',
    values: 'spacing',
  },
  paddingBottom: {
    className: 'pb',
    shorthand: 'pb',
    values: 'spacing',
  },
  paddingBlock: {
    className: 'py',
    values: 'spacing',
  },
  paddingBlockEnd: {
    className: 'pb',
    values: 'spacing',
  },
  paddingBlockStart: {
    className: 'pt',
    values: 'spacing',
  },
  paddingInline: {
    className: 'px',
    values: 'spacing',
  },
  paddingInlineEnd: {
    className: 'pe',
    shorthand: 'pe',
    values: 'spacing',
  },
  paddingInlineStart: {
    className: 'ps',
    shorthand: 'ps',
    values: 'spacing',
  },
  paddingX: {
    className: 'px',
    shorthand: 'px',
    property: 'paddingInline',
    values: 'spacing',
    transform(value) {
      return {
        paddingInline: value,
      }
    },
  },
  paddingY: {
    className: 'py',
    shorthand: 'py',
    values: 'spacing',
    property: 'paddingBlock',
    transform(value) {
      return {
        paddingBlock: value,
      }
    },
  },

  marginLeft: {
    className: 'ml',
    shorthand: 'ml',
    values: 'spacing',
  },
  marginRight: {
    className: 'mr',
    shorthand: 'mr',
    values: 'spacing',
  },
  marginTop: {
    className: 'mt',
    shorthand: 'mt',
    values: 'spacing',
  },
  marginBottom: {
    className: 'mb',
    shorthand: 'mb',
    values: 'spacing',
  },
  margin: {
    className: 'm',
    shorthand: 'm',
    values: 'spacing',
  },
  marginX: {
    className: 'mx',
    shorthand: 'mx',
    values: 'spacing',
    property: 'marginInline',
    transform(value) {
      return {
        marginInline: value,
      }
    },
  },
  marginY: {
    className: 'my',
    shorthand: 'my',
    values: 'spacing',
    property: 'marginBlock',
    transform(value) {
      return {
        marginBlock: value,
      }
    },
  },
  marginBlock: {
    className: 'my',
    values: 'spacing',
  },
  marginBlockEnd: {
    className: 'mb',
    values: 'spacing',
  },
  marginBlockStart: {
    className: 'mt',
    values: 'spacing',
  },
  marginInline: {
    className: 'mx',
    values: 'spacing',
  },
  marginInlineEnd: {
    className: 'me',
    shorthand: 'me',
    values: 'spacing',
  },
  marginInlineStart: {
    className: 'ms',
    shorthand: 'ms',
    values: 'spacing',
  },
}
