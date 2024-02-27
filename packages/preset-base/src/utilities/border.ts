import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const border: UtilityConfig = {
  borderRadius: {
    className: 'rounded',
    shorthand: 'rounded',
    values: 'radii',
    group: 'Border Radius',
  },
  borderTopLeftRadius: {
    className: 'rounded-tl',
    shorthand: 'roundedTopLeft',
    values: 'radii',
    group: 'Border Radius',
  },
  borderTopRightRadius: {
    className: 'rounded-tr',
    shorthand: 'roundedTopRight',
    values: 'radii',
    group: 'Border Radius',
  },
  borderBottomRightRadius: {
    className: 'rounded-br',
    shorthand: 'roundedBottomRight',
    values: 'radii',
    group: 'Border Radius',
  },
  borderBottomLeftRadius: {
    className: 'rounded-bl',
    shorthand: 'roundedBottomLeft',
    values: 'radii',
    group: 'Border Radius',
  },
  borderTopRadius: {
    className: 'rounded-t',
    shorthand: 'roundedTop',
    property: 'borderRadius',
    values: 'radii',
    group: 'Border Radius',
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
    property: 'borderRadius',
    values: 'radii',
    group: 'Border Radius',
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
    property: 'borderRadius',
    values: 'radii',
    group: 'Border Radius',
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
    property: 'borderRadius',
    group: 'Border Radius',
    transform(value) {
      return {
        borderTopLeftRadius: value,
        borderBottomLeftRadius: value,
      }
    },
  },
  borderStartStartRadius: {
    className: 'rounded-ss',
    shorthand: 'roundedStartStart',
    values: 'radii',
    group: 'Border Radius',
  },
  borderStartEndRadius: {
    className: 'rounded-se',
    shorthand: 'roundedStartEnd',
    values: 'radii',
    group: 'Border Radius',
  },
  borderStartRadius: {
    className: 'rounded-s',
    values: 'radii',
    property: 'borderRadius',
    shorthand: 'roundedStart',
    group: 'Border Radius',
    transform(value) {
      return {
        borderStartStartRadius: value,
        borderEndStartRadius: value,
      }
    },
  },
  borderEndStartRadius: {
    className: 'rounded-es',
    shorthand: 'roundedEndStart',
    values: 'radii',
    group: 'Border Radius',
  },
  borderEndEndRadius: {
    className: 'rounded-ee',
    shorthand: 'roundedEndEnd',
    values: 'radii',
    group: 'Border Radius',
  },
  borderEndRadius: {
    className: 'rounded-e',
    shorthand: 'roundedEnd',
    property: 'borderRadius',
    values: 'radii',
    group: 'Border Radius',
    transform(value) {
      return {
        borderStartEndRadius: value,
        borderEndEndRadius: value,
      }
    },
  },
  border: {
    className: 'border',
    values: 'borders',
    group: 'Border',
  },
  borderWidth: {
    className: 'border-w',
    values: 'borderWidths',
    group: 'Border Radius',
  },
  borderTopWidth: {
    className: 'border-tw',
    values: 'borderWidths',
    group: 'Border',
  },
  borderLeftWidth: {
    className: 'border-lw',
    values: 'borderWidths',
    group: 'Border',
  },
  borderRightWidth: {
    className: 'border-rw',
    values: 'borderWidths',
    group: 'Border',
  },
  borderBottomWidth: {
    className: 'border-bw',
    values: 'borderWidths',
    group: 'Border',
  },
  borderColor: {
    className: 'border',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderColor'),
  },
  borderInline: {
    className: 'border-x',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderX',
  },
  borderInlineWidth: {
    className: 'border-x',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderXWidth',
  },
  borderInlineColor: {
    className: 'border-x',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderXColor',
    transform: createColorMixTransform('borderInlineColor'),
  },
  borderBlock: {
    className: 'border-y',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderY',
  },
  borderBlockWidth: {
    className: 'border-y',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderYWidth',
  },
  borderBlockColor: {
    className: 'border-y',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderYColor',
    transform: createColorMixTransform('borderBlockColor'),
  },
  borderLeft: {
    className: 'border-l',
    values: 'borders',
    group: 'Border',
  },
  borderLeftColor: {
    className: 'border-l',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderLeftColor'),
  },
  borderInlineStart: {
    className: 'border-s',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderStart',
  },
  borderInlineStartWidth: {
    className: 'border-s',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderStartWidth',
  },
  borderInlineStartColor: {
    className: 'border-s',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderStartColor',
    transform: createColorMixTransform('borderInlineStartColor'),
  },
  borderRight: {
    className: 'border-r',
    values: 'borders',
    group: 'Border',
  },
  borderRightColor: {
    className: 'border-r',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderRightColor'),
  },
  borderInlineEnd: {
    className: 'border-e',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderEnd',
  },
  borderInlineEndWidth: {
    className: 'border-e',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderEndWidth',
  },
  borderInlineEndColor: {
    className: 'border-e',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderEndColor',
    transform: createColorMixTransform('borderInlineEndColor'),
  },
  borderTop: {
    className: 'border-t',
    values: 'borders',
    group: 'Border',
  },
  borderTopColor: {
    className: 'border-t',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderTopColor'),
  },
  borderBottom: {
    className: 'border-b',
    values: 'borders',
    group: 'Border',
  },
  borderBottomColor: {
    className: 'border-b',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBottomColor'),
  },
  borderBlockEnd: {
    className: 'border-be',
    values: 'borders',
    group: 'Border',
  },
  borderBlockEndColor: {
    className: 'border-be',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockEndColor'),
  },
  borderBlockStart: {
    className: 'border-bs',
    values: 'borders',
    group: 'Border',
  },
  borderBlockStartColor: {
    className: 'border-bs',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockStartColor'),
  },
}
