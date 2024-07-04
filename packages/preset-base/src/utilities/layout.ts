import type { UtilityConfig } from '@pandacss/types'

export const layout: UtilityConfig = {
  aspectRatio: {
    className: 'asp',
    values: 'aspectRatios',
    group: 'Layout',
  },
  boxDecorationBreak: {
    className: 'bx-db',
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
    className: 'bx-s',
    group: 'System',
  },

  objectPosition: {
    className: 'obj-p',
    group: 'Layout',
  },
  objectFit: {
    className: 'obj-f',
    group: 'Layout',
  },

  overscrollBehavior: {
    className: 'ovscl',
    group: 'Scroll',
  },
  overscrollBehaviorX: {
    className: 'ovscl-x',
    group: 'Scroll',
  },
  overscrollBehaviorY: {
    className: 'ovscl-y',
    group: 'Scroll',
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
  inset: {
    className: 'inset',
    group: 'Position',
    values: (theme) => ({
      auto: 'auto',
      ...theme('spacing'),
    }),
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
  insetBlockEnd: {
    className: 'inset-be',
    values: 'spacing',
    group: 'Position',
  },
  insetBlockStart: {
    className: 'inset-bs',
    values: 'spacing',
    group: 'Position',
  },
  insetInlineEnd: {
    className: 'inset-e',
    values: 'spacing',
    group: 'Position',
    shorthand: ['insetEnd', 'end'],
  },
  insetInlineStart: {
    className: 'inset-s',
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
    values: ['start', 'end'],
    property: 'float',
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
