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
  borderInline: {
    className: 'border-x',
    values: 'borders',
    shorthand: 'borderX',
  },
  borderInlineColor: {
    className: 'border-x',
    values: 'colors',
    shorthand: 'borderXColor',
  },
  borderBlock: {
    className: 'border-y',
    values: 'borders',
  },
  borderBlockColor: {
    className: 'border-y',
    values: 'colors',
    shorthand: 'borderYColor',
  },
  borderLeft: {
    className: 'border-l',
    values: 'borders',
  },
  borderLeftColor: {
    className: 'border-l',
    values: 'colors',
  },
  borderInlineStart: {
    className: 'border-s',
    values: 'borders',
  },
  borderInlineStartColor: {
    className: 'border-s',
  },
  borderRight: {
    className: 'border-r',
    values: 'borders',
  },
  borderRightColor: {
    className: 'border-r',
    values: 'colors',
  },
  borderInlineEnd: {
    className: 'border-end',
    values: 'borders',
  },
  borderInlineEndColor: {
    className: 'border-end',
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
  borderBlockEnd: {
    className: 'border-be',
    values: 'borders',
  },
  borderBlockEndColor: {
    className: 'border-be',
    values: 'colors',
  },
  borderBlockStart: {
    className: 'border-bs',
    values: 'borders',
  },
  borderBlockStartColor: {
    className: 'border-bs',
    values: 'colors',
  },
}
