import type { UtilityConfig } from '@pandacss/types'

export const layout: UtilityConfig = {
  aspectRatio: {
    className: 'aspect',
    values: {
      square: '1 / 1',
      landscape: '4 / 3',
      portrait: '3 / 4',
      wide: '16 / 9',
      ultrawide: '18 / 5',
      golden: '1.618 / 1',
    },
  },
  boxDecorationBreak: {
    className: 'decoration',
  },
  zIndex: {
    className: 'z',
  },
  boxSizing: {
    className: 'box',
  },

  objectPosition: {
    className: 'object',
  },
  objectFit: {
    className: 'object',
  },

  overscrollBehavior: {
    className: 'overscroll',
  },
  overscrollBehaviorX: {
    className: 'overscroll-x',
  },
  overscrollBehaviorY: {
    className: 'overscroll-y',
  },

  position: {
    className: 'pos',
    shorthand: 'pos',
  },
  top: {
    className: 't',
    values: 'spacing',
  },
  left: {
    className: 'l',
    values: 'spacing',
  },
  insetInline: {
    className: 'inset-x',
    values: 'spacing',
  },
  insetBlock: {
    className: 'inset-y',
    values: 'spacing',
  },
  inset: {
    className: 'inset',
    values: 'spacing',
  },
  insetBlockEnd: {
    className: 'inset-b',
    values: 'spacing',
  },
  insetBlockStart: {
    className: 'inset-t',
    values: 'spacing',
  },
  insetInlineEnd: {
    className: 'end',
    values: 'spacing',
    shorthand: 'insetEnd',
  },
  insetInlineStart: {
    className: 'start',
    values: 'spacing',
    shorthand: 'insetStart',
  },
  start: {
    className: 's',
    values: 'spacing',
    transform(value) {
      return {
        insetInlineStart: value,
      }
    },
  },
  right: {
    className: 'r',
    values: 'spacing',
  },
  end: {
    className: 'e',
    values: 'spacing',
    transform(value) {
      return {
        insetInlineEnd: value,
      }
    },
  },
  bottom: {
    className: 'b',
    values: 'spacing',
  },
  insetX: {
    className: 'inset-x',
    values: 'spacing',
    property: 'insetInline',
    transform(value) {
      return {
        insetInline: value,
      }
    },
  },
  insetY: {
    className: 'inset-y',
    values: 'spacing',
    property: 'insetBlock',
    transform(value) {
      return {
        insetBlock: value,
      }
    },
  },
  float: {
    className: 'float',
    values: ['left', 'right', 'start', 'end'],
    transform(value) {
      if (value === 'start') {
        return {
          float: 'left',
          '[dir="rtl"] &': {
            float: 'right',
          },
        }
      }

      if (value === 'end') {
        return {
          float: 'right',
          '[dir="rtl"] &': {
            float: 'left',
          },
        }
      }

      return {
        float: value,
      }
    },
  },
  visibility: {
    className: 'vis',
  },
}
