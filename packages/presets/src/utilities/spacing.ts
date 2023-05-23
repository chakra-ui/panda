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
    shorthand: ['py', 'paddingY'],
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
    shorthand: ['paddingX', 'px'],
  },
  paddingInlineEnd: {
    className: 'pe',
    shorthand: ['pe', 'paddingEnd'],
    values: 'spacing',
  },
  paddingInlineStart: {
    className: 'ps',
    shorthand: ['ps', 'paddingStart'],
    values: 'spacing',
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
  marginBlock: {
    className: 'my',
    values: 'spacing',
    shorthand: ['my', 'marginY'],
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
    shorthand: ['mx', 'marginX'],
  },
  marginInlineEnd: {
    className: 'me',
    shorthand: ['me', 'marginEnd'],
    values: 'spacing',
  },
  marginInlineStart: {
    className: 'ms',
    shorthand: ['ms', 'marginStart'],
    values: 'spacing',
  },
}
