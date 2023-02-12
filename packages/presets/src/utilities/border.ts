import type { UtilityConfig } from '@pandacss/types'

export const border: UtilityConfig = {
  borderRadius: {
    className: 'rounded',
    shorthand: 'rounded',
    values: 'radii',
  },
  borderTopLeftRadius: {
    className: 'rounded-tl',
    shorthand: 'roundedTopLeft',
    values: 'radii',
  },
  borderTopRightRadius: {
    className: 'rounded-tr',
    shorthand: 'roundedTopRight',
    values: 'radii',
  },
  borderBottomRightRadius: {
    className: 'rounded-br',
    shorthand: 'roundedBottomRight',
    values: 'radii',
  },
  borderBottomLeftRadius: {
    className: 'rounded-bl',
    shorthand: 'roundedBottomLeft',
    values: 'radii',
  },
  borderTopRadius: {
    className: 'rounded-t',
    shorthand: 'roundedTop',
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
    shorthand: 'roundedRight',
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
    shorthand: 'roundedBottom',
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
    shorthand: 'roundedLeft',
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
    shorthand: 'roundedStartStart',
    values: 'radii',
  },
  borderStartEndRadius: {
    className: 'rounded-start-end',
    shorthand: 'roundedStartEnd',
    values: 'radii',
  },
  borderStartRadius: {
    className: 'rounded-start',
    values: 'radii',
    shorthand: 'roundedStart',
    transform(value) {
      return {
        borderStartStartRadius: value,
        borderStartEndRadius: value,
      }
    },
  },
  borderEndStartRadius: {
    className: 'rounded-end-start',
    shorthand: 'roundedEndStart',
    values: 'radii',
  },
  borderEndEndRadius: {
    className: 'rounded-end-end',
    shorthand: 'roundedEndEnd',
    values: 'radii',
  },
  borderEndRadius: {
    className: 'rounded-end',
    shorthand: 'roundedEnd',
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
