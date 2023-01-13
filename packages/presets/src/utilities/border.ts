import type { UtilityConfig } from '@pandacss/types'

export const border: UtilityConfig = {
  borderRadius: {
    className: 'rounded',
    values: 'radii',
  },
  borderTopLeftRadius: {
    className: 'rounded-tl',
    values: 'radii',
  },
  borderTopRightRadius: {
    className: 'rounded-tr',
    values: 'radii',
  },
  borderBottomRightRadius: {
    className: 'rounded-br',
    values: 'radii',
  },
  borderBottomLeftRadius: {
    className: 'rounded-bl',
    values: 'radii',
  },
  borderTopRadius: {
    className: 'rounded-t',
    values: 'radii',
    transform(value) {
      return {
        borderTopLeftRadius: value,
        borderTopRightRadius: value,
      }
    },
  },
  borderRightRadius: {
    className: 'rounded-r',
    values: 'radii',
    transform(value) {
      return {
        borderTopRightRadius: value,
        borderBottomRightRadius: value,
      }
    },
  },
  borderBottomRadius: {
    className: 'rounded-b',
    values: 'radii',
    transform(value) {
      return {
        borderBottomLeftRadius: value,
        borderBottomRightRadius: value,
      }
    },
  },
  borderLeftRadius: {
    className: 'rounded-l',
    values: 'radii',
    transform(value) {
      return {
        borderTopLeftRadius: value,
        borderBottomLeftRadius: value,
      }
    },
  },

  borderStartStartRadius: {
    className: 'rounded-start-start',
    values: 'radii',
  },
  borderStartEndRadius: {
    className: 'rounded-start-end',
    values: 'radii',
  },
  borderStartRadius: {
    className: 'rounded-start',
    values: 'radii',
    transform(value) {
      return {
        borderStartStartRadius: value,
        borderStartEndRadius: value,
      }
    },
  },
  borderEndStartRadius: {
    className: 'rounded-end-start',
    values: 'radii',
  },
  borderEndEndRadius: {
    className: 'rounded-end-end',
    values: 'radii',
  },
  borderEndRadius: {
    className: 'rounded-end',
    values: 'radii',
    transform(value) {
      return {
        borderEndStartRadius: value,
        borderEndEndRadius: value,
      }
    },
  },

  border: {
    className: 'border',
    values: 'borders',
  },
  borderColor: {
    className: 'border',
    values: 'colors',
  },
  borderXColor: {
    className: 'border-x',
    values: 'colors',
    property: 'borderColor',
    transform(value) {
      return {
        borderLeftColor: value,
        borderRightColor: value,
      }
    },
  },
  borderYColor: {
    className: 'border-y',
    values: 'colors',
    property: 'borderColor',
    transform(value) {
      return {
        borderTopColor: value,
        borderBottomColor: value,
      }
    },
  },
  borderLeft: {
    className: 'border-l',
    values: 'borders',
  },
  borderLeftColor: {
    className: 'border-l',
    values: 'colors',
  },
  borderRight: {
    className: 'border-r',
    values: 'borders',
  },
  borderRightColor: {
    className: 'border-r',
    values: 'colors',
  },
  borderTop: {
    className: 'border-t',
    values: 'borders',
  },
  borderTopColor: {
    className: 'border-t',
    values: 'colors',
  },
  borderBottom: {
    className: 'border-b',
    values: 'borders',
  },
  borderBottomColor: {
    className: 'border-b',
    values: 'colors',
  },
  borderX: {
    className: 'border-x',
    property: 'border',
    values: 'borders',
    transform(value) {
      return {
        borderInline: value,
      }
    },
  },
  borderY: {
    className: 'border-y',
    property: 'border',
    values: 'borders',
    transform(value) {
      return {
        borderBlock: value,
      }
    },
  },
  borderStyle: {
    className: 'border',
  },

  // Outline
  outlineWidth: {
    className: 'outline',
  },
  outlineColor: {
    className: 'outline',
    values: 'colors',
  },
  outline: {
    className: 'outline',
    values: 'borders',
    transform(value) {
      if (value === 'none') {
        return {
          outline: '2px solid transparent',
          outlineOffset: '2px',
        }
      }
      return {
        outline: value,
      }
    },
  },

  // Divider
  divideX: {
    className: 'divide-x',
    values: { type: 'string' },
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderLeftWidth: value,
          borderRightWidth: '0px',
        },
      }
    },
  },
  divideY: {
    className: 'divide-y',
    values: { type: 'string' },
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderTopWidth: value,
          borderBottomWidth: '0px',
        },
      }
    },
  },
  divideColor: {
    className: 'divide',
    values: 'colors',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderColor: value,
        },
      }
    },
  },
  divideStyle: {
    className: 'divide',
    property: 'borderStyle',
    transform(value) {
      return {
        '& > :not([hidden]) ~ :not([hidden])': {
          borderStyle: value,
        },
      }
    },
  },
}
