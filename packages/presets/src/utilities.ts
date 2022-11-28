import type { UtilityConfig } from '@pandacss/types'

const layout: UtilityConfig = {
  aspectRatio: {
    className: 'aspect',
    values: {
      square: '1 / 1',
      landscape: '4 / 3',
      portrait: '3 / 4',
      wide: '16 / 9',
      ultrawide: '18 / 5',
      golden: '1.618 / 1',
    },
  },
  boxDecorationBreak: {
    className: 'box-decoration',
  },
  display: {
    className: 'd',
  },
  zIndex: {
    className: 'z',
  },
  boxSizing: {
    className: 'box',
  },

  objectPosition: {
    className: 'object',
  },
  objectFit: {
    className: 'object',
  },

  overscrollBehavior: {
    className: 'overscroll',
  },
  overscrollBehaviorX: {
    className: 'overscroll-x',
  },
  overscrollBehaviorY: {
    className: 'overscroll-y',
  },

  position: {
    className: 'pos',
    shorthand: 'pos',
  },
  top: {
    className: 't',
    values: 'spacing',
  },
  left: {
    className: 'l',
    values: 'spacing',
  },
  insetInline: {
    className: 'inset-x',
    values: 'spacing',
  },
  insetBlock: {
    className: 'inset-y',
    values: 'spacing',
  },
  inset: {
    className: 'inset',
    values: 'spacing',
  },
  insetBlockEnd: {
    className: 'inset-b',
    values: 'spacing',
  },
  insetBlockStart: {
    className: 'inset-t',
    values: 'spacing',
  },
  insetInlineEnd: {
    className: 'inset-r',
    values: 'spacing',
  },
  insetInlineStart: {
    className: 'inset-l',
    values: 'spacing',
  },
  start: {
    className: 's',
    values: 'spacing',
    transform(value) {
      return {
        insetInlineStart: value,
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
        insetInlineEnd: value,
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
    property: 'insetInline',
    transform(value) {
      return {
        insetInline: value,
      }
    },
  },
  insetY: {
    className: 'inset-y',
    values: 'spacing',
    property: 'insetBlock',
    transform(value) {
      return {
        insetBlock: value,
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
    className: 'vis',
  },
}

const spacing: UtilityConfig = {
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
  paddingBlock: {
    className: 'py',
    values: 'spacing',
  },
  paddingBlockEnd: {
    className: 'pb',
    values: 'spacing',
  },
  paddingBlockStart: {
    className: 'pt',
    values: 'spacing',
  },
  paddingInline: {
    className: 'px',
    values: 'spacing',
  },
  paddingInlineEnd: {
    className: 'pe',
    shorthand: 'pe',
    values: 'spacing',
  },
  paddingInlineStart: {
    className: 'ps',
    shorthand: 'ps',
    values: 'spacing',
  },
  paddingX: {
    className: 'px',
    shorthand: 'px',
    property: 'paddingInline',
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
    property: 'paddingBlock',
    transform(value) {
      return {
        paddingBlock: value,
      }
    },
  },

  marginLeft: {
    className: 'ml',
    shorthand: 'ml',
    values: 'spacing',
  },
  marginRight: {
    className: 'mr',
    shorthand: 'mr',
    values: 'spacing',
  },
  marginTop: {
    className: 'mt',
    shorthand: 'mt',
    values: 'spacing',
  },
  marginBottom: {
    className: 'mb',
    shorthand: 'mb',
    values: 'spacing',
  },
  margin: {
    className: 'm',
    shorthand: 'm',
    values: 'spacing',
  },
  marginX: {
    className: 'mx',
    shorthand: 'mx',
    values: 'spacing',
    property: 'marginInline',
    transform(value) {
      return {
        marginInline: value,
      }
    },
  },
  marginY: {
    className: 'my',
    shorthand: 'my',
    values: 'spacing',
    property: 'marginBlock',
    transform(value) {
      return {
        marginBlock: value,
      }
    },
  },
  marginBlock: {
    className: 'my',
    values: 'spacing',
  },
  marginBlockEnd: {
    className: 'mb',
    values: 'spacing',
  },
  marginBlockStart: {
    className: 'mt',
    values: 'spacing',
  },
  marginInline: {
    className: 'mx',
    values: 'spacing',
  },
  marginInlineEnd: {
    className: 'me',
    shorthand: 'me',
    values: 'spacing',
  },
  marginInlineStart: {
    className: 'ms',
    shorthand: 'ms',
    values: 'spacing',
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
}

const flexGrid: UtilityConfig = {
  flexBasis: {
    className: 'basis',
    values(theme) {
      return {
        ...theme('spacing'),
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
        full: '100%',
      }
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
  gridColumnStart: {
    className: 'col-start',
  },
  gridColumnEnd: {
    className: 'col-end',
  },
  gridAutoFlow: {
    className: 'grid-flow',
  },
  gridAutoColumns: {
    className: 'auto-cols',
    values: {
      min: 'min-content',
      max: 'max-content',
      fr: 'minmax(0, 1fr)',
    },
  },
  gridAutoRows: {
    className: 'auto-rows',
    values: {
      min: 'min-content',
      max: 'max-content',
      fr: 'minmax(0, 1fr)',
    },
  },
  gap: {
    className: 'gap',
    values: 'spacing',
  },
  gridGap: {
    className: 'gap',
    values: 'spacing',
  },
  gridRowGap: {
    className: 'gap-x',
    values: 'spacing',
  },
  gridColumnGap: {
    className: 'gap-y',
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
}

const sizing: UtilityConfig = {
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
    shorthand: 'h',
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
}

const typography: UtilityConfig = {
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
    values: 'colors',
  },
  textEmphasisColor: {
    className: 'emphasis',
    values: 'colors',
  },
  textDecorationStyle: {
    className: 'decoration',
  },
  textDecorationThickness: {
    className: 'decoration',
  },
  textUnderlineOffset: {
    className: 'underline-offset',
  },
  textTransform: {
    className: 'text',
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
}

const list: UtilityConfig = {
  listStyleType: {
    className: 'list',
  },
  listStylePosition: {
    className: 'list',
  },
}

const background: UtilityConfig = {
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
  backgroundPosition: {
    shorthand: 'bgPos',
    className: 'bg',
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
  backgroundSize: {
    shorthand: 'bgSize',
    className: 'bg',
  },
  backgroundGradient: {
    shorthand: 'bgGradient',
    className: 'bg-gradient',
    values(theme) {
      return {
        ...theme('gradients'),
        'to-t': 'linear-gradient(to top, var(--gradient))',
        'to-tr': 'linear-gradient(to top right, var(--gradient))',
        'to-r': 'linear-gradient(to right, var(--gradient))',
        'to-br': 'linear-gradient(to bottom right, var(--gradient))',
        'to-b': 'linear-gradient(to bottom, var(--gradient))',
        'to-bl': 'linear-gradient(to bottom left, var(--gradient))',
        'to-l': 'linear-gradient(to left, var(--gradient))',
        'to-tl': 'linear-gradient(to top left, var(--gradient))',
      }
    },
    transform(value) {
      return {
        '--gradient-stops': 'var(--gradient-from), var(--gradient-to)',
        '--gradient': 'var(--gradient-via-stops, var(--gradient-stops))',
        backgroundImage: value,
      }
    },
  },
  textGradient: {
    className: 'text-gradient',
    values(theme) {
      return {
        ...theme('gradients'),
        'to-t': 'linear-gradient(to top, var(--gradient))',
        'to-tr': 'linear-gradient(to top right, var(--gradient))',
        'to-r': 'linear-gradient(to right, var(--gradient))',
        'to-br': 'linear-gradient(to bottom right, var(--gradient))',
        'to-b': 'linear-gradient(to bottom, var(--gradient))',
        'to-bl': 'linear-gradient(to bottom left, var(--gradient))',
        'to-l': 'linear-gradient(to left, var(--gradient))',
        'to-tl': 'linear-gradient(to top left, var(--gradient))',
      }
    },
    transform(value) {
      return {
        '--gradient-stops': 'var(--gradient-from), var(--gradient-to)',
        '--gradient': 'var(--gradient-via-stops, var(--gradient-stops))',
        backgroundImage: value,
        backgroundClip: 'text',
        color: 'transparent',
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
        '--gradient-via-stops': 'var(--gradient-from), var(--gradient-via), var(--gradient-to)',
        '--gradient-via': value,
      }
    },
  },
}

const border: UtilityConfig = {
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
  border: {
    className: 'border',
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
  },
  borderLeftColor: {
    className: 'border-l',
    values: 'colors',
  },
  borderRight: {
    className: 'border-r',
  },
  borderRightColor: {
    className: 'border-r',
    values: 'colors',
  },
  borderTop: {
    className: 'border-t',
  },
  borderTopColor: {
    className: 'border-t',
    values: 'colors',
  },
  borderBottom: {
    className: 'border-b',
  },
  borderBottomColor: {
    className: 'border-b',
    values: 'colors',
  },
  borderX: {
    className: 'border-x',
    property: 'border',
    transform(value) {
      return {
        borderInline: value,
      }
    },
  },
  borderY: {
    className: 'border-y',
    property: 'border',
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
  },
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

const effects: UtilityConfig = {
  boxShadow: {
    shorthand: 'shadow',
    className: 'shadow',
    values: 'shadows',
  },
  boxShadowColor: {
    shorthand: 'shadowColor',
    className: 'shadow',
    values: 'colors',
    transform(value) {
      return {
        '--shadow-color': value,
      }
    },
  },
  mixBlendMode: {
    className: 'mix-blend',
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
    values: 'dropShadows',
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
}

const tables: UtilityConfig = {
  borderCollapse: {
    className: 'border',
  },
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
        borderSpacing: `${value} var(--border-spacing-y)`,
      }
    },
  },
  borderSpacingY: {
    className: 'border-spacing-y',
    values: 'spacing',
    transform(value) {
      return {
        borderSpacing: `var(--border-spacing-x) ${value}`,
      }
    },
  },
  tableLayout: {
    className: 'table',
  },
}

const transitions: UtilityConfig = {
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
}

const transformTemplate = [
  'rotate(var(--rotate, 0))',
  'scaleX(var(--scale-x, 1))',
  'scaleY(var(--scale-y, 1))',
  'skewX(var(--skew-x, 0))',
  'skewY(var(--skew-y, 0))',
]

const baseTransformTemplate = [
  'translateX(var(--translate-x, 0))',
  'translateY(var(--translate-y, 0))',
  ...transformTemplate,
].join(' ')

const gpuTransformTemplate = [
  'translate3d(var(--translate-x, 0), var(--translate-y, 0), 0)',
  ...transformTemplate,
].join(' ')

const transforms: UtilityConfig = {
  transform: {
    className: 'transform',
    values: {
      auto: baseTransformTemplate,
      'auto-gpu': gpuTransformTemplate,
    },
  },
  transformOrigin: {
    className: 'origin',
  },
  scale: {
    className: 'scale',
    transform(value) {
      return {
        '--scale-x': value,
        '--scale-y': value,
      }
    },
  },
  scaleX: {
    className: 'scale-x',
    transform(value) {
      return {
        '--scale-x': value,
      }
    },
  },
  scaleY: {
    className: 'scale-y',
    transform(value) {
      return {
        '--scale-y': value,
      }
    },
  },
  rotate: {
    className: 'rotate',
    transform(value) {
      return {
        '--rotate': value,
      }
    },
  },
  translateX: {
    shorthand: 'x',
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
        '--translate-x': value,
      }
    },
  },
  translateY: {
    shorthand: 'y',
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
        '--translate-y': value,
      }
    },
  },
  skewX: {
    className: 'skew-x',
    transform(value) {
      return {
        '--skew-x': value,
      }
    },
  },
  skewY: {
    className: 'skew-y',
    transform(value) {
      return {
        '--skew-y': value,
      }
    },
  },
}

const interactivity: UtilityConfig = {
  accentColor: {
    className: 'accent',
    values: 'colors',
  },
  caretColor: {
    className: 'caret',
    values: 'colors',
  },
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
    property: 'scrollMarginInline',
    transform(value) {
      return {
        scrollMarginInline: value,
      }
    },
  },
  scrollMarginY: {
    className: 'scroll-my',
    values: 'spacing',
    property: 'scrollMarginBlock',
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
  scrollMarginBlock: {
    className: 'scroll-my',
    values: 'spacing',
  },
  scrollMarginBlockEnd: {
    className: 'scroll-mb',
    values: 'spacing',
  },
  scrollMarginBlockStart: {
    className: 'scroll-mt',
    values: 'spacing',
  },
  scrollMarginInline: {
    className: 'scroll-mx',
    values: 'spacing',
  },
  scrollMarginInlineEnd: {
    className: 'scroll-mr',
    values: 'spacing',
  },
  scrollMarginInlineStart: {
    className: 'scroll-ml',
    values: 'spacing',
  },
  scrollPadding: {
    className: 'scroll-p',
    values: 'spacing',
  },
  scrollPaddingBlock: {
    className: 'scroll-pb',
    values: 'spacing',
  },
  scrollPaddingBlockStart: {
    className: 'scroll-pt',
    values: 'spacing',
  },
  scrollPaddingBlockEnd: {
    className: 'scroll-pb',
    values: 'spacing',
  },
  scrollPaddingInline: {
    className: 'scroll-px',
    values: 'spacing',
  },
  scrollPaddingInlineEnd: {
    className: 'scroll-pr',
    values: 'spacing',
  },
  scrollPaddingInlineStart: {
    className: 'scroll-pl',
    values: 'spacing',
  },
  scrollPaddingX: {
    className: 'scroll-px',
    values: 'spacing',
    property: 'scrollPaddingInline',
    transform(value) {
      return {
        scrollPaddingInline: value,
      }
    },
  },
  scrollPaddingY: {
    className: 'scroll-py',
    values: 'spacing',
    property: 'scrollPaddingBlock',
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
  scrollSnapMargin: {
    className: 'snap-m',
    values: 'spacing',
  },
  scrollSnapMarginTop: {
    className: 'snap-mt',
    values: 'spacing',
  },
  scrollSnapMarginBottom: {
    className: 'snap-mb',
    values: 'spacing',
  },
  scrollSnapMarginLeft: {
    className: 'snap-ml',
    values: 'spacing',
  },
  scrollSnapMarginRight: {
    className: 'snap-mr',
    values: 'spacing',
  },
  touchAction: {
    className: 'touch',
  },
  userSelect: {
    className: 'select',
  },
}

const svg: UtilityConfig = {
  fill: {
    className: 'fill',
    values: 'colors',
  },
  stroke: {
    className: 'stroke',
    values: 'colors',
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
  srOnly: {
    className: 'sr',
    values: ['true', 'false'],
    transform(value) {
      return srMapping[value] || {}
    },
  },
}

const others: UtilityConfig = {
  debug: {
    className: 'debug',
    values: { type: 'boolean' },
    transform(value) {
      if (!value) return {}
      return {
        outline: '1px solid blue !important',
        '&>*': {
          outline: '1px solid red !important',
        },
      }
    },
  },
  truncate: {
    className: 'truncate',
    values: { type: 'boolean' },
    transform(value) {
      if (!value) return {}
      return {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }
    },
  },
}

export const utilities: UtilityConfig = Object.assign(
  {},
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
  others,
)
