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
    objectFit: 'object',
    overscrollBehavior: 'overscroll',
    overscrollBehaviorX: 'overscroll-x',
    overscrollBehaviorY: 'overscroll-y',
    position: {
      className: (value) => value,
    },

    // Divider
    divideX: {
      className: 'divide-x',
      valueType: 'string',
      transform(value) {
        return {
          '& > * ~ *': {
            borderLeftWidth: value,
            borderRightWidth: '0px',
          },
        }
      },
    },
    divideY: {
      className: 'divide-y',
      valueType: 'string',
      transform(value) {
        return {
          '& > * ~ *': {
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
          '& > * ~ *': {
            borderColor: value,
          },
        }
      },
    },
    divideStyle: {
      className: 'divide',
      cssType: 'borderStyle',
      transform(value) {
        return {
          '& > * ~ *': {
            borderStyle: value,
          },
        }
      },
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
    start: {
      className: 's',
      values: 'spacing',
      transform(value) {
        return {
          left: value,
          "[dir='rtl'] &": {
            right: value,
          },
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
          right: value,
          "[dir='rtl'] &": {
            left: value,
          },
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

    // Color properties
    color: {
      className: 'text',
      values: 'colors',
    },
    fill: {
      className: 'fill',
      values: 'colors',
    },
    stroke: {
      className: 'stroke',
      values: 'colors',
    },
    accentColor: {
      className: 'accent',
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

    // Flex properties
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
    fontFamily: {
      className: 'font',
      values: 'fonts',
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
    fontVariantNumeric: {
      className(value) {
        return value
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
    lineClamp: {
      className: 'clamp',
      transform(value) {
        if (value === 'none') {
          return {
            '-webkit-line-clamp': 'unset',
          }
        }

        return {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-line-clamp': value,
          '-webkit-box-orient': 'vertical',
        }
      },
    },

    // List properties
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
      values: 'sizes',
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
    background: {
      className: 'bg',
      values: 'colors',
    },
    backgroundColor: {
      className: 'bg',
      values: 'colors',
    },
    backgroundOrigin: 'bg-origin',
    backgroundRepeat: 'bg-repeat',
    backgroundBlendMode: 'bg-blend',
    backgroundGradient: {
      className: 'bg-gradient',
      values: {
        none: 'none',
        'to-t': 'linear-gradient(to top, var(--gradient-stops))',
        'to-tr': 'linear-gradient(to top right, var(--gradient-stops))',
        'to-r': 'linear-gradient(to right, var(--gradient-stops))',
        'to-br': 'linear-gradient(to bottom right, var(--gradient-stops))',
        'to-b': 'linear-gradient(to bottom, var(--gradient-stops))',
        'to-bl': 'linear-gradient(to bottom left, var(--gradient-stops))',
        'to-l': 'linear-gradient(to left, var(--gradient-stops))',
        'to-tl': 'linear-gradient(to top left, var(--gradient-stops))',
      },
      transform(value) {
        return {
          '--gradient-stops': 'var(--gradient-from), var(--gradient-to)',
          backgroundImage: value,
        }
      },
    },
    gradientFrom: {
      className: 'from',
      values: 'colors',
      transform(value) {
        return {
          '--gradient-from': value,
        }
      },
    },
    gradientTo: {
      className: 'to',
      values: 'colors',
      transform(value) {
        return {
          '--gradient-to': value,
        }
      },
    },

    // Transition properties
    transitionTimingFunction: {
      className: 'ease',
      values: 'easings',
    },
    transitionDelay: 'delay',
    transitionDuration: 'duration',
    transitionProperty: {
      className: 'transition',
      values: 'transitionProperties',
    },
    animation: {
      className: 'animation',
      values: 'animations',
    },

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

    // Effect properties
    boxShadow: {
      className: 'shadow',
      values: 'shadows',
    },
    filter: {
      className: 'filter',
      values: {
        auto: [
          'var(--blur)',
          'var(--brightness)',
          'var(--contrast)',
          'var(--grayscale)',
          'var(--hue-rotate)',
          'var(--invert)',
          'var(--saturate)',
          'var(--sepia)',
          'var(--drop-shadow)',
        ].join(' '),
      },
    },
    brightness: {
      className: 'brightness',
      transform(value) {
        return {
          '--brightness': `brightness(${value})`,
        }
      },
    },
    contrast: {
      className: 'contrast',
      transform(value) {
        return {
          '--contrast': `constrast(${value})`,
        }
      },
    },
    grayscale: {
      className: 'grayscale',
      transform(value) {
        return {
          '--grayscale': `grayscale(${value})`,
        }
      },
    },
    hueRotate: {
      className: 'hue-rotate',
      transform(value) {
        return {
          '--hue-rotate': `hue-rotate(${value})`,
        }
      },
    },
    invert: {
      className: 'invert',
      transform(value) {
        return {
          '--invert': `invert(${value})`,
        }
      },
    },
    saturate: {
      className: 'saturate',
      transform(value) {
        return {
          '--saturate': `saturate(${value})`,
        }
      },
    },
    sepia: {
      className: 'sepia',
      transform(value) {
        return {
          '--sepia': `sepia(${value})`,
        }
      },
    },
    dropShadow: {
      className: 'drop-shadow',
      transform(value) {
        return {
          '--drop-shadow': value,
        }
      },
    },
    blur: {
      className: 'blur',
      valueType: 'string & {}',
      transform(value) {
        return {
          '--blur': `blur(${value})`,
        }
      },
    },

    // Interactivity properties
    scrollBehavior: 'scroll',
    scrollMargin: {
      className: 'scroll-m',
      values: 'spacing',
    },
    scrollMarginX: {
      className: 'scroll-mx',
      values: 'spacing',
      transform(value) {
        return {
          scrollMarginInline: value,
        }
      },
    },
    scrollMarginY: {
      className: 'scroll-my',
      values: 'spacing',
      transform(value) {
        return {
          scrollMarginBlock: value,
        }
      },
    },
    scrollMarginLeft: {
      className: 'scroll-ml',
      values: 'spacing',
    },
    scrollMarginRight: {
      className: 'scroll-mr',
      values: 'spacing',
    },
    scrollMarginTop: {
      className: 'scroll-mt',
      values: 'spacing',
    },
    scrollMarginBottom: {
      className: 'scroll-mb',
      values: 'spacing',
    },
    scrollPadding: {
      className: 'scroll-p',
      values: 'spacing',
    },
    scrollPaddingX: {
      className: 'scroll-px',
      values: 'spacing',
      transform(value) {
        return {
          scrollPaddingInline: value,
        }
      },
    },
    scrollPaddingY: {
      className: 'scroll-py',
      values: 'spacing',
      transform(value) {
        return {
          scrollPaddingBlock: value,
        }
      },
    },
    scrollPaddingLeft: {
      className: 'scroll-pl',
      values: 'spacing',
    },
    scrollPaddingRight: {
      className: 'scroll-pr',
      values: 'spacing',
    },
    scrollPaddingTop: {
      className: 'scroll-pt',
      values: 'spacing',
    },
    scrollPaddingBottom: {
      className: 'scroll-pb',
      values: 'spacing',
    },
    scrollSnapAlign: 'snap',
    scrollSnapStop: 'snap',
    scrollSnapType: {
      className: 'snap',
      values: {
        none: 'none',
        x: 'x var(--scroll-snap-strictness)',
        y: 'y var(--scroll-snap-strictness)',
        both: 'both var(--scroll-snap-strictness)',
      },
    },
    scrollSnapStrictness: {
      className: 'strictness',
      values: ['mandatory', 'proximity'],
      transform(value) {
        return {
          '--scroll-snap-strictness': value,
        }
      },
    },
    touchAction: 'touch',
    userSelect: 'select',

    // Screen reader
    srOnly: {
      className: 'sr',
      values: ['true', 'false'],
      transform(value) {
        return srMapping[value] || {}
      },
    },
  },
}

const srMapping = {
  true: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  },
  false: {
    position: 'static',
    width: 'auto',
    height: 'auto',
    padding: '0',
    margin: '0',
    overflow: 'visible',
    clip: 'auto',
    whiteSpace: 'normal',
  },
}
