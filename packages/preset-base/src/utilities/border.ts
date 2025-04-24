import type { UtilityConfig } from '@pandacss/types'
import { createColorMixTransform } from '../color-mix-transform'

export const border: UtilityConfig = {
  // Border Radius
  borderRadius: {
    className: 'bdr',
    shorthand: 'rounded',
    values: 'radii',
    group: 'Border Radius',
  },
  borderTopLeftRadius: {
    className: 'bdr-tl',
    shorthand: 'roundedTopLeft',
    values: 'radii',
    group: 'Border Radius',
  },
  borderTopRightRadius: {
    className: 'bdr-tr',
    shorthand: 'roundedTopRight',
    values: 'radii',
    group: 'Border Radius',
  },
  borderBottomRightRadius: {
    className: 'bdr-br',
    shorthand: 'roundedBottomRight',
    values: 'radii',
    group: 'Border Radius',
  },
  borderBottomLeftRadius: {
    className: 'bdr-bl',
    shorthand: 'roundedBottomLeft',
    values: 'radii',
    group: 'Border Radius',
  },
  borderTopRadius: {
    className: 'bdr-t',
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
    className: 'bdr-r',
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
    className: 'bdr-b',
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
    className: 'bdr-l',
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
    className: 'bdr-ss',
    shorthand: 'roundedStartStart',
    values: 'radii',
    group: 'Border Radius',
  },
  borderStartEndRadius: {
    className: 'bdr-se',
    shorthand: 'roundedStartEnd',
    values: 'radii',
    group: 'Border Radius',
  },
  borderStartRadius: {
    className: 'bdr-s',
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
    className: 'bdr-es',
    shorthand: 'roundedEndStart',
    values: 'radii',
    group: 'Border Radius',
  },
  borderEndEndRadius: {
    className: 'bdr-ee',
    shorthand: 'roundedEndEnd',
    values: 'radii',
    group: 'Border Radius',
  },
  borderEndRadius: {
    className: 'bdr-e',
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

  // Border
  border: {
    className: 'bd',
    values: 'borders',
    group: 'Border',
  },
  borderWidth: {
    className: 'bd-w',
    values: 'borderWidths',
    group: 'Border Radius',
  },
  borderTopWidth: {
    className: 'bd-t-w',
    values: 'borderWidths',
    group: 'Border',
  },
  borderLeftWidth: {
    className: 'bd-l-w',
    values: 'borderWidths',
    group: 'Border',
  },
  borderRightWidth: {
    className: 'bd-r-w',
    values: 'borderWidths',
    group: 'Border',
  },
  borderBottomWidth: {
    className: 'bd-b-w',
    values: 'borderWidths',
    group: 'Border',
  },
  borderBlockStartWidth: {
    className: 'bd-bs-w',
    values: 'borderWidths',
    group: 'Border Radius',
  },
  borderBlockEndWidth: {
    className: 'bd-be-w',
    values: 'borderWidths',
    group: 'Border Radius',
  },
  borderColor: {
    className: 'bd-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderColor'),
  },
  borderInline: {
    className: 'bd-x',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderX',
  },
  borderInlineWidth: {
    className: 'bd-x-w',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderXWidth',
  },
  borderInlineColor: {
    className: 'bd-x-c',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderXColor',
    transform: createColorMixTransform('borderInlineColor'),
  },
  borderBlock: {
    className: 'bd-y',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderY',
  },
  borderBlockWidth: {
    className: 'bd-y-w',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderYWidth',
  },
  borderBlockColor: {
    className: 'bd-y-c',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderYColor',
    transform: createColorMixTransform('borderBlockColor'),
  },
  borderLeft: {
    className: 'bd-l',
    values: 'borders',
    group: 'Border',
  },
  borderLeftColor: {
    className: 'bd-l-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderLeftColor'),
  },
  borderInlineStart: {
    className: 'bd-s',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderStart',
  },
  borderInlineStartWidth: {
    className: 'bd-s-w',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderStartWidth',
  },
  borderInlineStartColor: {
    className: 'bd-s-c',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderStartColor',
    transform: createColorMixTransform('borderInlineStartColor'),
  },
  borderRight: {
    className: 'bd-r',
    values: 'borders',
    group: 'Border',
  },
  borderRightColor: {
    className: 'bd-r-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderRightColor'),
  },
  borderInlineEnd: {
    className: 'bd-e',
    values: 'borders',
    group: 'Border',
    shorthand: 'borderEnd',
  },
  borderInlineEndWidth: {
    className: 'bd-e-w',
    values: 'borderWidths',
    group: 'Border',
    shorthand: 'borderEndWidth',
  },
  borderInlineEndColor: {
    className: 'bd-e-c',
    values: 'colors',
    group: 'Border',
    shorthand: 'borderEndColor',
    transform: createColorMixTransform('borderInlineEndColor'),
  },
  borderTop: {
    className: 'bd-t',
    values: 'borders',
    group: 'Border',
  },
  borderTopColor: {
    className: 'bd-t-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderTopColor'),
  },
  borderBottom: {
    className: 'bd-b',
    values: 'borders',
    group: 'Border',
  },
  borderBottomColor: {
    className: 'bd-b-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBottomColor'),
  },
  borderBlockEnd: {
    className: 'bd-be',
    values: 'borders',
    group: 'Border',
  },
  borderBlockEndColor: {
    className: 'bd-be-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockEndColor'),
  },
  borderBlockStart: {
    className: 'bd-bs',
    values: 'borders',
    group: 'Border',
  },
  borderBlockStartColor: {
    className: 'bd-bs-c',
    values: 'colors',
    group: 'Border',
    transform: createColorMixTransform('borderBlockStartColor'),
  },
}
