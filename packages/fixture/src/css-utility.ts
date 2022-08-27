import { UtilityConfig } from '@css-panda/types'

export const utilities: UtilityConfig = {
  properties: {
    // Layout properties
    display: {
      className: (value) => (value === 'none' ? 'hidden' : value),
    },
    zIndex: 'z',
    boxSizing: 'box',
    objectPosition: 'object',
    overscrollBehavior: 'overscroll',
    position: {
      className: (value) => value,
    },

    // Position properties
    top: {
      className: 't',
      values: 'spacing',
    },
    left: {
      className: 'l',
      values: 'spacing',
    },
    right: {
      className: 'r',
      values: 'spacing',
    },
    bottom: {
      className: 'b',
      values: 'spacing',
    },
    insetX: {
      className: 'inset-x',
      values: 'spacing',
      transform(value) {
        return {
          left: value,
          right: value,
        }
      },
    },
    insetY: {
      className: 'inset-y',
      values: 'spacing',
      transform(value) {
        return {
          top: value,
          bottom: value,
        }
      },
    },

    // Color properties
    background: {
      className: 'bg',
      values: 'colors',
    },
    color: {
      className: 'text',
      values: 'colors',
    },
    outlineColor: {
      className: 'oc',
      values: 'colors',
    },

    aspectRatio: {
      className: 'aspect',
      values: {
        auto: 'auto',
        square: '1 / 1',
        video: '16 / 9',
      },
    },

    // Grid and Flex properties
    gridTemplateColumns: {
      className: 'grid-cols',
    },
    gridColumnStart: 'grid-col-start',
    gridColumnEnd: 'grid-col-end',
    gridAutoFlow: 'grid-flow',
    gridAutoColumns: 'auto-cols',
    gridAutoRows: 'auto-rows',
    gap: {
      className: 'gap',
      values: 'spacing',
    },
    rowGap: {
      className: 'gap-x',
      values: 'spacing',
    },
    columnGap: {
      className: 'gap-y',
      values: 'spacing',
    },
    justifyContent: {
      className: 'justify',
    },
    alignContent: {
      className: 'content',
    },
    alignItems: 'items',
    alignSelf: 'self',
    // Flex
    flexBasis: {
      className: 'basis',
      values: {
        '0': '0',
        '1/2': '50%',
        '1/3': '33.333333%',
        '2/3': '66.666667%',
        '1/4': '25%',
      },
    },
    flex: {
      className: 'flex',
      values: {
        '1': '1 1 0%',
        auto: '1 1 auto',
        initial: '0 1 auto',
        none: 'none',
      },
    },
    flexDirection: 'flex',
    flexGrow: 'grow',
    flexShrink: 'shrink',

    // Padding properties
    padding: {
      className: 'p',
      values: 'spacing',
    },
    paddingLeft: {
      className: 'pl',
      values: 'spacing',
    },
    paddingRight: {
      className: 'pr',
      values: 'spacing',
    },
    paddingTop: {
      className: 'pt',
      values: 'spacing',
    },
    paddingBottom: {
      className: 'pb',
      values: 'spacing',
    },
    paddingX: {
      className: 'px',
      values: 'spacing',
      transform(value) {
        return {
          paddingInline: value,
        }
      },
    },
    paddingY: {
      className: 'py',
      values: 'spacing',
      transform(value) {
        return {
          paddingBlock: value,
        }
      },
    },

    // Typography properties
    fontSize: {
      className: 'fs',
      values: 'fontSizes',
    },
    fontWeight: {
      className: 'fw',
      values: 'fontWeights',
    },
    fontSmoothing: {
      className: 'smoothing',
      values: {
        antialiased: 'antialiased',
        'subpixel-antialiased': 'auto',
      },
      transform(value) {
        return {
          '-webkit-font-smoothing': value,
        }
      },
    },
    letterSpacing: {
      className: 'tracking',
      values: 'letterSpacings',
    },
    lineHeight: {
      className: 'leading',
      values: 'lineHeights',
    },
    textAlign: 'text',
    textDecoration: {
      className(value) {
        return value
      },
    },
    textDecorationColor: 'decoration',
    textDecorationStyle: 'decoration',
    textDecorationThickness: 'decoration',
    textUnderlineOffset: 'underline',
    textTransform: {
      className(value) {
        return value
      },
    },
    textIndent: {
      className: 'indent',
      values: 'spacing',
    },
    verticalAlign: 'align',
    wordBreak: 'break',
    listStyleType: 'list',
    listStylePosition: 'list',

    // Sizing properties
    width: {
      className: 'w',
      values(theme) {
        return {
          ...theme('sizes'),
          '1/2': '50%',
          '1/3': '33.333333%',
          '2/3': '66.666667%',
          '1/4': '25%',
          '2/4': '50%',
        }
      },
    },
    height: {
      className: 'h',
      values: 'sizes',
    },
    minHeight: {
      className: 'min-h',
      values: 'sizes',
    },
    maxHeight: {
      className: 'max-h',
      values: 'sizes',
    },
    minWidth: {
      className: 'min-w',
      values: 'spacing',
    },
    maxWidth: {
      className: 'max-w',
      values: 'largeSizes',
    },

    // Margin properties
    marginLeft: {
      className: 'ml',
      values: 'spacing',
    },
    marginRight: {
      className: 'mr',
      values: 'spacing',
    },
    marginTop: {
      className: 'mt',
      values: 'spacing',
    },
    marginBottom: {
      className: 'mb',
      values: 'spacing',
    },
    margin: {
      className: 'm',
      values: 'spacing',
    },
    marginX: {
      className: 'mx',
      values: 'spacing',
      transform(value) {
        return {
          marginInline: value,
        }
      },
    },
    marginY: {
      className: 'my',
      values: 'spacing',
      transform(value) {
        return {
          marginBlock: value,
        }
      },
    },

    // Background properties
    backgroundAttachment: 'bg',
    backgroundClip: 'bg-clip',
    backgroundColor: {
      className: 'bg',
      values: 'colors',
    },
    backgroundOrigin: 'bg-origin',
    backgroundRepeat: 'bg-repeat',
    backgroundBlendMode: 'bg-blend',

    // Transition properties
    transitionTimingFunction: 'ease',
    transitionDelay: 'delay',
    transitionDuration: 'duration',
    transitionProperty: 'transition',

    // Border properties
    borderRadius: {
      className: 'rounded',
      values: 'radii',
    },
    border: 'border',
    borderLeft: 'border-l',
    borderRight: 'border-r',
    borderTop: 'border-t',
    borderBottom: 'border-b',
    borderX: {
      className: 'border-x',
      transform(value) {
        return {
          borderInline: value,
        }
      },
    },
    borderY: {
      className: 'border-y',
      transform(value) {
        return {
          borderBlock: value,
        }
      },
    },
  },
}
