import type { UtilityConfig } from '@css-panda/types'

const layout: UtilityConfig = {
  properties: {
    aspectRatio: {
      className: 'aspect',
      values: {
        auto: 'auto',
        square: '1 / 1',
        video: '16 / 9',
      },
    },
    boxDecorationBreak: 'box-decoration',
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
    visibility: {
      className(value) {
        return value === 'visible' ? 'visible' : 'invisible'
      },
    },
  },
}

const spacing: UtilityConfig = {
  properties: {
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

    spaceX: {
      className: 'space-x',
      values: 'spacing',
      transform(value) {
        return {
          '& > :not([hidden]) ~ :not([hidden])': {
            marginInlineStart: value,
          },
        }
      },
    },
    spaceY: {
      className: 'space-y',
      values: 'spacing',
      transform(value) {
        return {
          '& > :not([hidden]) ~ :not([hidden])': {
            marginBlockStart: value,
          },
        }
      },
    },
  },
}

const flexGrid: UtilityConfig = {
  properties: {
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

    gridTemplateColumns: {
      className: 'grid-cols',
      values: {
        '1': 'repeat(1, minmax(0, 1fr))',
        '2': 'repeat(2, minmax(0, 1fr))',
        '3': 'repeat(3, minmax(0, 1fr))',
        '4': 'repeat(4, minmax(0, 1fr))',
        '5': 'repeat(5, minmax(0, 1fr))',
        '6': 'repeat(6, minmax(0, 1fr))',
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
    },
    gridTemplateRows: {
      className: 'grid-cols',
      values: {
        '1': 'repeat(1, minmax(0, 1fr))',
        '2': 'repeat(2, minmax(0, 1fr))',
        '3': 'repeat(3, minmax(0, 1fr))',
        '4': 'repeat(4, minmax(0, 1fr))',
        '5': 'repeat(5, minmax(0, 1fr))',
        '6': 'repeat(6, minmax(0, 1fr))',
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
    },
    gridColumn: {
      className: 'col-span',
      values: {
        auto: 'auto',
        full: '1 / -1',
        '1': 'span 1 / span 1',
        '2': 'span 2 / span 2',
        '3': 'span 3 / span 3',
        '4': 'span 4 / span 4',
        '5': 'span 5 / span 5',
        '6': 'span 6 / span 6',
        '7': 'span 7 / span 7',
        '8': 'span 8 / span 8',
        '9': 'span 9 / span 9',
        '10': 'span 10 / span 10',
        '11': 'span 11 / span 11',
        '12': 'span 12 / span 12',
      },
    },
    gridRow: {
      className: 'row-span',
      values: {
        auto: 'auto',
        full: '1 / -1',
        '1': 'span 1 / span 1',
        '2': 'span 2 / span 2',
        '3': 'span 3 / span 3',
        '4': 'span 4 / span 4',
        '5': 'span 5 / span 5',
        '6': 'span 6 / span 6',
        '7': 'span 7 / span 7',
        '8': 'span 8 / span 8',
        '9': 'span 9 / span 9',
        '10': 'span 10 / span 10',
        '11': 'span 11 / span 11',
        '12': 'span 12 / span 12',
      },
    },
    gridColumnStart: 'col-start',
    gridColumnEnd: 'col-end',
    gridAutoFlow: 'grid-flow',
    gridAutoColumns: {
      className: 'auto-cols',
      values: {
        auto: 'auto',
        min: 'min-content',
        max: 'max-content',
        fr: 'minmax(0, 1fr)',
      },
    },
    gridAutoRows: {
      className: 'auto-rows',
      values: {
        auto: 'auto',
        min: 'min-content',
        max: 'max-content',
        fr: 'minmax(0, 1fr)',
      },
    },
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
  },
}

const sizing: UtilityConfig = {
  properties: {
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
          '3/4': '75%',
          '1/5': '20%',
          '2/5': '40%',
          '3/5': '60%',
          '4/5': '80%',
          '1/6': '16.666667%',
          '2/6': '33.333333%',
          '3/6': '50%',
          '4/6': '66.666667%',
          '5/6': '83.333333%',
          '1/12': '8.333333%',
          '2/12': '16.666667%',
          '3/12': '25%',
          '4/12': '33.333333%',
          '5/12': '41.666667%',
          '6/12': '50%',
          '7/12': '58.333333%',
          '8/12': '66.666667%',
          '9/12': '75%',
          '10/12': '83.333333%',
          '11/12': '91.666667%',
          screen: '100vw',
        }
      },
    },
    height: {
      className: 'h',
      values(theme) {
        return {
          ...theme('sizes'),
          '1/2': '50%',
          '1/3': '33.333333%',
          '2/3': '66.666667%',
          '1/4': '25%',
          '2/4': '50%',
          '3/4': '75%',
          '1/5': '20%',
          '2/5': '40%',
          '3/5': '60%',
          '4/5': '80%',
          '1/6': '16.666667%',
          '2/6': '33.333333%',
          '3/6': '50%',
          '4/6': '66.666667%',
          '5/6': '83.333333%',
        }
      },
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
  },
}

const typography: UtilityConfig = {
  properties: {
    color: {
      className: 'text',
      values: 'colors',
    },
    fontFamily: {
      className: 'font',
      values: 'fonts',
    },
    fontSize: {
      className: 'fs',
      values: 'fontSizes',
    },
    fontWeight: {
      className: 'font',
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
        return value === 'none' ? 'no-underline' : value
      },
    },
    textDecorationColor: 'decoration',
    textDecorationStyle: 'decoration',
    textDecorationThickness: 'decoration',
    textUnderlineOffset: 'underline-offset',
    textTransform: {
      className(value) {
        return value === 'none' ? 'normal-case' : value
      },
    },
    textIndent: {
      className: 'indent',
      values: 'spacing',
    },
    textOverflow: {
      className: 'text',
      values: ['ellipsis', 'clip', 'truncate'],
      transform(value) {
        if (value === 'truncate') {
          return {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        }
        return {
          textOverflow: value,
        }
      },
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
  },
}

const list: UtilityConfig = {
  properties: {
    listStyleType: 'list',
    listStylePosition: 'list',
  },
}

const background: UtilityConfig = {
  properties: {
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
    backgroundPosition: 'bg',
    backgroundOrigin: 'bg-origin',
    backgroundRepeat: 'bg-repeat',
    backgroundBlendMode: 'bg-blend',
    backgroundSize: 'bg',
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
    gradientVia: {
      className: 'via',
      values: 'colors',
      transform(value) {
        return {
          '--gradient-stops': 'var(--gradient-from),var(--gradient-via), var(--gradient-to)',
          '--gradient-via': value,
        }
      },
    },
  },
}

const border: UtilityConfig = {
  properties: {
    borderRadius: {
      className: 'rounded',
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
    border: 'border',
    borderColor: {
      className: 'border',
      values: 'colors',
    },
    borderXColor: {
      className: 'border-x',
      values: 'colors',
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
      transform(value) {
        return {
          borderTopColor: value,
          borderBottomColor: value,
        }
      },
    },
    borderLeft: 'border-l',
    borderLeftColor: {
      className: 'border-l',
      values: 'colors',
    },
    borderRight: 'border-r',
    borderRightColor: {
      className: 'border-r',
      values: 'colors',
    },
    borderTop: 'border-t',
    borderTopColor: {
      className: 'border-t',
      values: 'colors',
    },
    borderBottom: 'border-b',
    borderBottomColor: {
      className: 'border-b',
      values: 'colors',
    },
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
    borderStyle: 'border',

    // Outline
    outlineWidth: 'outline',
    outlineColor: 'outline',
    outline: {
      className: 'outline',
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
      cssType: 'borderStyle',
      transform(value) {
        return {
          '& > :not([hidden]) ~ :not([hidden])': {
            borderStyle: value,
          },
        }
      },
    },
  },
}

const effects: UtilityConfig = {
  properties: {
    boxShadow: {
      className: 'shadow',
      values: 'shadows',
    },
    mixBlendMode: 'mix-blend',
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
      values: 'dropshows',
      transform(value) {
        return {
          '--drop-shadow': value,
        }
      },
    },
    blur: {
      className: 'blur',
      values: 'blurs',
      transform(value) {
        return {
          '--blur': `blur(${value})`,
        }
      },
    },

    backdropFilter: {
      className: 'backdrop',
      values: {
        auto: [
          'var(--backdrop-blur)',
          'var(--backdrop-brightness)',
          'var(--backdrop-contrast)',
          'var(--backdrop-grayscale)',
          'var(--backdrop-hue-rotate)',
          'var(--backdrop-invert)',
          'var(--backdrop-saturate)',
          'var(--backdrop-sepia)',
        ].join(' '),
      },
    },
    backdropBlur: {
      className: 'backdrop-blur',
      values: 'blurs',
      transform(value) {
        return {
          '--backdrop-blur': `blur(${value})`,
        }
      },
    },
    backdropBrightness: {
      className: 'backdrop-brightness',
      transform(value) {
        return {
          '--backdrop-brightness': `brightness(${value})`,
        }
      },
    },
    backdropContrast: {
      className: 'backdrop-contrast',
      transform(value) {
        return {
          '--backdrop-contrast': `constrast(${value})`,
        }
      },
    },
    backdropGrayscale: {
      className: 'backdrop-grayscale',
      transform(value) {
        return {
          '--backdrop-grayscale': `grayscale(${value})`,
        }
      },
    },
    backdropHueRotate: {
      className: 'backdrop-hue-rotate',
      transform(value) {
        return {
          '--backdrop-hue-rotate': `hue-rotate(${value})`,
        }
      },
    },
    backdropInvert: {
      className: 'backdrop-invert',
      transform(value) {
        return {
          '--backdrop-invert': `invert(${value})`,
        }
      },
    },
    backdropOpacity: {
      className: 'backdrop-opacity',
      transform(value) {
        return {
          '--backdrop-opacity': value,
        }
      },
    },
    backdropSaturate: {
      className: 'backdrop-saturate',
      transform(value) {
        return {
          '--backdrop-saturate': `saturate(${value})`,
        }
      },
    },
    backdropSepia: {
      className: 'backdrop-sepia',
      transform(value) {
        return {
          '--backdrop-sepia': `sepia(${value})`,
        }
      },
    },
  },
}

const tables: UtilityConfig = {
  properties: {
    borderCollapse: 'border',
    borderSpacing: {
      className: 'border-spacing',
      values: 'spacing',
      transform(value) {
        return {
          borderSpacing: `${value} ${value}`,
        }
      },
    },
    borderSpacingX: {
      className: 'border-spacing-x',
      values: 'spacing',
      transform(value) {
        return {
          borderSpacing: `${value} var(--tw-border-spacing-y)`,
        }
      },
    },
    borderSpacingY: {
      className: 'border-spacing-y',
      values: 'spacing',
      transform(value) {
        return {
          borderSpacing: `var(--tw-border-spacing-x) ${value}`,
        }
      },
    },
    tableLayout: 'table',
  },
}

const transitions: UtilityConfig = {
  properties: {
    transitionTimingFunction: {
      className: 'ease',
      values: 'easings',
    },
    transitionDelay: 'delay',
    transitionDuration: 'duration',
    transitionProperty: {
      className: 'transition',
      values: {
        all: 'all',
        none: 'none',
        opacity: 'opacity',
        shadow: 'box-shadow',
        transform: 'transform',
        base: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
        background: 'background, background-color',
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
    },
    animation: {
      className: 'animation',
      values: 'animations',
    },
  },
}

const transformVars = [
  'var(--tw-translate-x)',
  'var(--tw-translate-y)',
  'var(--tw-rotate)',
  'var(--tw-skew-x)',
  'var(--tw-skew-y)',
  'var(--tw-scale-x)',
  'var(--tw-scale-y)',
].join(' ')

const transforms: UtilityConfig = {
  properties: {
    transform: {
      className: 'transform',
      values: {
        auto: `translate(${transformVars})`,
        'auto-gpu': `translate3d(${transformVars})`,
      },
    },
    transformOrigin: 'origin',
    scale: {
      className: 'scale',
      transform(value) {
        return {
          '--tw-scale-x': value,
          '--tw-scale-y': value,
        }
      },
    },
    scaleX: {
      className: 'scale-x',
      transform(value) {
        return {
          '--tw-scale-x': value,
        }
      },
    },
    scaleY: {
      className: 'scale-y',
      transform(value) {
        return {
          '--tw-scale-y': value,
        }
      },
    },
    rotate: {
      className: 'rotate',
      transform(value) {
        return {
          '--tw-rotate': value,
        }
      },
    },
    translateX: {
      className: 'translate-x',
      values(theme) {
        return {
          ...theme('spacing'),
          '1/2': '50%',
          '1/3': '33.333333%',
          '2/3': '66.666667%',
          '1/4': '25%',
          '2/4': '50%',
          '3/4': '75%',
          full: '100%',
        }
      },
      transform(value) {
        return {
          '--tw-translate-x': value,
        }
      },
    },
    translateY: {
      className: 'translate-y',
      values(theme) {
        return {
          ...theme('spacing'),
          '1/2': '50%',
          '1/3': '33.333333%',
          '2/3': '66.666667%',
          '1/4': '25%',
          '2/4': '50%',
          '3/4': '75%',
          full: '100%',
        }
      },
      transform(value) {
        return {
          '--tw-translate-y': value,
        }
      },
    },
    skewX: {
      className: 'skew-x',
      transform(value) {
        return {
          '--tw-skew-x': value,
        }
      },
    },
    skewY: {
      className: 'skew-y',
      transform(value) {
        return {
          '--tw-skew-y': value,
        }
      },
    },
  },
}

const interactivity: UtilityConfig = {
  properties: {
    accentColor: {
      className: 'accent',
      values: 'colors',
    },
    caretColor: {
      className: 'caret',
      values: 'colors',
    },
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
  },
}

const svg: UtilityConfig = {
  properties: {
    fill: {
      className: 'fill',
      values: 'colors',
    },
    stroke: {
      className: 'stroke',
      values: 'colors',
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

const accessibility: UtilityConfig = {
  properties: {
    srOnly: {
      className: 'sr',
      values: ['true', 'false'],
      transform(value) {
        return srMapping[value] || {}
      },
    },
  },
}

export const utilities: UtilityConfig[] = [
  layout,
  flexGrid,
  spacing,
  sizing,
  typography,
  list,
  background,
  border,
  effects,
  tables,
  transitions,
  transforms,
  interactivity,
  svg,
  accessibility,
]
