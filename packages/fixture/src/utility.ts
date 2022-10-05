import type { UtilityConfig } from '@css-panda/types'

export const utilities: UtilityConfig = {
  // Layout properties
  display: {
    className: 'd',
  },
  zIndex: {
    className: 'z',
    shorthand: 'z',
  },
  boxSizing: {
    className: 'box',
  },
  objectPosition: {
    className: 'object',
    shorthand: 'objectPos',
  },
  objectFit: {
    className: 'object',
  },
  overscrollBehavior: {
    className: 'overscroll',
    shorthand: 'overscroll',
  },
  overscrollBehaviorX: {
    className: 'overscroll-x',
    shorthand: 'overscrollX',
  },
  overscrollBehaviorY: {
    className: 'overscroll-y',
    shorthand: 'overscrollY',
  },
  position: {
    className: 'pos',
    shorthand: 'pos',
  },

  // Divider
  divideX: {
    className: 'divide-x',
    values: { type: 'string' },
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
    values: { type: 'string' },
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
    property: 'borderStyle',
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
  gridColumnStart: {
    className: 'grid-col-start',
  },
  gridColumnEnd: {
    className: 'grid-col-end',
  },
  gridAutoFlow: {
    className: 'grid-flow',
  },
  gridAutoColumns: {
    className: 'auto-cols',
  },
  gridAutoRows: {
    className: 'auto-rows',
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
  alignItems: {
    className: 'items',
  },
  alignSelf: {
    className: 'self',
  },

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
  flexDirection: {
    className: 'flex',
    shorthand: 'flexDir',
  },
  flexGrow: {
    className: 'grow',
  },
  flexShrink: {
    className: 'shrink',
  },

  // Padding properties
  padding: {
    className: 'p',
    shorthand: 'p',
    values: 'spacing',
  },
  paddingLeft: {
    className: 'pl',
    shorthand: 'pl',
    values: 'spacing',
  },
  paddingRight: {
    className: 'pr',
    shorthand: 'pr',
    values: 'spacing',
  },
  paddingTop: {
    className: 'pt',
    shorthand: 'pt',
    values: 'spacing',
  },
  paddingBottom: {
    className: 'pb',
    shorthand: 'pb',
    values: 'spacing',
  },
  paddingX: {
    className: 'px',
    shorthand: 'px',
    values: 'spacing',
    transform(value) {
      return {
        paddingInline: value,
      }
    },
  },
  paddingY: {
    className: 'py',
    shorthand: 'py',
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
    className: 'numeric',
  },
  letterSpacing: {
    className: 'tracking',
    values: 'letterSpacings',
  },
  lineHeight: {
    className: 'leading',
    values: 'lineHeights',
  },
  textAlign: {
    className: 'text',
  },
  textDecoration: {
    className: 'decor',
  },
  textDecorationColor: {
    className: 'decoration',
  },
  textDecorationStyle: {
    className: 'decoration',
  },
  textDecorationThickness: {
    className: 'decoration',
  },
  textUnderlineOffset: {
    className: 'underline',
  },
  textTransform: {
    className: 'case',
  },
  textIndent: {
    className: 'indent',
    values: 'spacing',
  },
  verticalAlign: {
    className: 'align',
  },
  wordBreak: {
    className: 'break',
  },
  lineClamp: {
    className: 'clamp',
    transform(value) {
      if (value === 'none') {
        return { '-webkit-line-clamp': 'unset' }
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
  listStyleType: {
    className: 'list',
  },
  listStylePosition: {
    className: 'list',
  },

  // Sizing properties
  width: {
    shorthand: 'w',
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
    shorthand: 'h',
    values: 'sizes',
  },
  minHeight: {
    shorthand: 'minH',
    className: 'min-h',
    values: 'sizes',
  },
  maxHeight: {
    shorthand: 'maxH',
    className: 'max-h',
    values: 'sizes',
  },
  minWidth: {
    shorthand: 'minW',
    className: 'min-w',
    values: 'sizes',
  },
  maxWidth: {
    shorthand: 'maxW',
    className: 'max-w',
    values: 'largeSizes',
  },

  // Margin properties
  marginLeft: {
    shorthand: 'ml',
    className: 'ml',
    values: 'spacing',
  },
  marginRight: {
    shorthand: 'mr',
    className: 'mr',
    values: 'spacing',
  },
  marginTop: {
    shorthand: 'mt',
    className: 'mt',
    values: 'spacing',
  },
  marginBottom: {
    shorthand: 'mb',
    className: 'mb',
    values: 'spacing',
  },
  margin: {
    shorthand: 'm',
    className: 'm',
    values: 'spacing',
  },
  marginX: {
    shorthand: 'mx',
    className: 'mx',
    values: 'spacing',
    transform(value) {
      return {
        marginInline: value,
      }
    },
  },
  marginY: {
    shorthand: 'my',
    className: 'my',
    values: 'spacing',
    transform(value) {
      return {
        marginBlock: value,
      }
    },
  },

  // Background properties
  backgroundAttachment: {
    shorthand: 'bgAttachment',
    className: 'bg',
  },
  backgroundClip: {
    shorthand: 'bgClip',
    className: 'bg-clip',
  },
  background: {
    shorthand: 'bg',
    className: 'bg',
    values: 'colors',
  },
  backgroundColor: {
    shorthand: 'bgColor',
    className: 'bg',
    values: 'colors',
  },
  backgroundOrigin: {
    shorthand: 'bgOrigin',
    className: 'bg-origin',
  },
  backgroundRepeat: {
    shorthand: 'bgRepeat',
    className: 'bg-repeat',
  },
  backgroundBlendMode: {
    shorthand: 'bgBlend',
    className: 'bg-blend',
  },
  backgroundGradient: {
    shorthand: 'bgGradient',
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
  transitionDelay: {
    className: 'delay',
  },
  transitionDuration: {
    className: 'duration',
  },
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

  // Border properties
  borderRadius: {
    className: 'rounded',
    values: 'radii',
  },
  border: {
    className: 'border',
  },
  borderLeft: {
    className: 'border-l',
  },
  borderRight: {
    className: 'border-r',
  },
  borderTop: {
    className: 'border-t',
  },
  borderBottom: {
    className: 'border-b',
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

  // Effect properties
  boxShadow: {
    shorthand: 'shadow',
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
    values: { type: 'string | number' },
    transform(value) {
      return {
        '--blur': `blur(${value})`,
      }
    },
  },

  // Interactivity properties
  scrollBehavior: {
    className: 'scroll',
  },
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
  scrollSnapAlign: {
    className: 'snap',
  },
  scrollSnapStop: {
    className: 'snap',
  },
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
  touchAction: {
    className: 'touch',
  },
  userSelect: {
    className: 'select',
  },

  // Screen reader
  srOnly: {
    className: 'sr',
    values: ['true', 'false'],
    transform(value) {
      return srMapping[value] || {}
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
