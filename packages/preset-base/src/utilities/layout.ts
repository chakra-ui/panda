import type { UtilityConfig } from '@pandacss/types'

export const layout: UtilityConfig = {
  aspectRatio: {
    className: 'aspect',
    values: 'aspectRatios',
    group: 'Layout',
  },
  boxDecorationBreak: {
    className: 'decoration',
    group: 'Layout',
    transform(value) {
      return {
        boxDecorationBreak: value,
        WebkitBoxDecorationBreak: value,
      }
    },
  },
  zIndex: {
    className: 'z',
    values: 'zIndex',
    group: 'Visibility',
  },
  boxSizing: {
    className: 'box',
    group: 'System',
  },

  objectPosition: {
    className: 'object',
    group: 'Layout',
  },
  objectFit: {
    className: 'object',
    group: 'Layout',
  },

  overscrollBehavior: {
    className: 'overscroll',
    group: 'Layout',
  },
  overscrollBehaviorX: {
    className: 'overscroll-x',
    group: 'Layout',
  },
  overscrollBehaviorY: {
    className: 'overscroll-y',
    group: 'Layout',
  },

  position: {
    className: 'pos',
    shorthand: 'pos',
    group: 'Position',
  },
  top: {
    className: 'top',
    values: 'spacing',
    group: 'Position',
  },
  left: {
    className: 'left',
    values: 'spacing',
    group: 'Position',
  },
  insetInline: {
    className: 'inset-x',
    values: 'spacing',
    group: 'Position',
    shorthand: ['insetX'],
  },
  insetBlock: {
    className: 'inset-y',
    values: 'spacing',
    group: 'Position',
    shorthand: ['insetY'],
  },
  inset: {
    className: 'inset',
    group: 'Position',
    values: (theme) => ({
      auto: 'auto',
      ...theme('spacing'),
    }),
  },
  insetBlockEnd: {
    className: 'inset-b',
    values: 'spacing',
    group: 'Position',
  },
  insetBlockStart: {
    className: 'inset-t',
    values: 'spacing',
    group: 'Position',
  },
  insetInlineEnd: {
    className: 'end',
    values: 'spacing',
    group: 'Position',
    shorthand: ['insetEnd', 'end'],
  },
  insetInlineStart: {
    className: 'start',
    values: 'spacing',
    group: 'Position',
    shorthand: ['insetStart', 'start'],
  },
  right: {
    className: 'right',
    values: 'spacing',
    group: 'Position',
  },
  bottom: {
    className: 'bottom',
    values: 'spacing',
    group: 'Position',
  },
  float: {
    className: 'float',
    values: ['left', 'right', 'start', 'end'],
    group: 'Position',
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
    group: 'Visibility',
  },
}
