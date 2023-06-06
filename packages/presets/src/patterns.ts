import type { AnyPatternConfig, PatternConfig } from '@pandacss/types'

// inlining this function to avoid having to depend on @pandacss/dev
function definePattern<Pattern>(config: PatternConfig<Pattern>) {
  return config as AnyPatternConfig
}

const box = definePattern({
  properties: {},
  transform(props) {
    return props
  },
})

const flex = definePattern({
  properties: {
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
    direction: { type: 'property', value: 'flexDirection' },
    wrap: { type: 'property', value: 'flexWrap' },
    basis: { type: 'property', value: 'flexBasis' },
    grow: { type: 'property', value: 'flexGrow' },
    shrink: { type: 'property', value: 'flexShrink' },
  },
  transform(props) {
    const { direction, align, justify, wrap, basis, grow, shrink, ...rest } = props
    return {
      display: 'flex',
      flexDirection: direction,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap,
      flexBasis: basis,
      flexGrow: grow,
      flexShrink: shrink,
      ...rest,
    }
  },
})

const stack = definePattern({
  properties: {
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
    direction: { type: 'property', value: 'flexDirection' },
    gap: { type: 'property', value: 'gap' },
  },
  transform(props) {
    const { align, justify, direction = 'column', gap = '10px', ...rest } = props
    return {
      display: 'flex',
      flexDirection: direction,
      alignItems: align,
      justifyContent: justify,
      gap,
      ...rest,
    }
  },
})

const vstack = definePattern({
  jsx: 'VStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'property', value: 'gap' },
  },
  transform(props) {
    const { justify, gap = '10px', ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      flexDirection: 'column',
      ...rest,
    }
  },
})

const hstack = definePattern({
  jsx: 'HStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'property', value: 'gap' },
  },
  transform(props) {
    const { justify, gap = '10px', ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      flexDirection: 'row',
      ...rest,
    }
  },
})

const spacer = definePattern({
  properties: {
    size: { type: 'token', value: 'spacing' },
  },
  transform(props, { map }) {
    const { size, ...rest } = props
    return {
      alignSelf: 'stretch',
      justifySelf: 'stretch',
      flex: map(size, (v) => (v == null ? '1' : `0 0 ${v}`)),
      ...rest,
    }
  },
})

const circle = definePattern({
  properties: {
    size: { type: 'property', value: 'width' },
  },
  transform(props) {
    const { size, ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 auto',
      width: size,
      height: size,
      borderRadius: '9999px',
      ...rest,
    }
  },
})

const square = definePattern({
  properties: {
    size: { type: 'property', value: 'width' },
  },
  transform(props) {
    const { size, ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '0 0 auto',
      width: size,
      height: size,
      ...rest,
    }
  },
})

const absoluteCenter = definePattern({
  properties: {
    axis: { type: 'enum', value: ['x', 'y', 'both'] },
  },
  transform(props, { map }) {
    const { axis = 'both', ...rest } = props
    return {
      position: 'absolute',
      insetBlockStart: map(axis, (v) => (v === 'x' ? 'auto' : '50%')),
      insetInlineStart: map(axis, (v) => (v === 'y' ? 'auto' : '50%')),
      transform: map(axis, (v) =>
        v === 'both' ? 'translate(-50%, -50%)' : v === 'x' ? 'translateX(-50%)' : 'translateY(-50%)',
      ),
      maxWidth: '100%',
      maxHeight: '100%',
      ...rest,
    }
  },
})

const grid = definePattern({
  properties: {
    gap: { type: 'property', value: 'gap' },
    columnGap: { type: 'property', value: 'gap' },
    rowGap: { type: 'property', value: 'gap' },
    columns: { type: 'number' },
    minChildWidth: { type: 'token', value: 'sizes', property: 'width' },
  },
  transform(props, { map }) {
    const { columnGap, rowGap, gap = columnGap || rowGap ? undefined : '10px', columns, minChildWidth, ...rest } = props
    return {
      display: 'grid',
      gridTemplateColumns:
        columns != null
          ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`)
          : minChildWidth != null
          ? map(minChildWidth, (v) => `repeat(auto-fit, minmax(${v}, 1fr))`)
          : undefined,
      gap,
      columnGap,
      rowGap,
      ...rest,
    }
  },
})

const gridItem = definePattern({
  properties: {
    colSpan: { type: 'number' },
    rowSpan: { type: 'number' },
    colStart: { type: 'number' },
    rowStart: { type: 'number' },
    colEnd: { type: 'number' },
    rowEnd: { type: 'number' },
  },
  transform(props, { map }) {
    const { colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd, ...rest } = props
    const spanFn = (v: string) => (v === 'auto' ? v : `span ${v}`)
    return {
      gridColumn: colSpan != null ? map(colSpan, spanFn) : undefined,
      gridRow: rowSpan != null ? map(rowSpan, spanFn) : undefined,
      gridColumnEnd: colEnd,
      gridRowEnd: rowEnd,
      ...rest,
    }
  },
})

const wrap = definePattern({
  properties: {
    gap: { type: 'property', value: 'gap' },
    rowGap: { type: 'property', value: 'gap' },
    columnGap: { type: 'property', value: 'gap' },
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
  },
  transform(props) {
    const { columnGap, rowGap, gap = columnGap || rowGap ? undefined : '10px', align, justify, ...rest } = props
    return {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: align,
      justifyContent: justify,
      gap,
      columnGap,
      rowGap,
      ...rest,
    }
  },
})

const container = definePattern({
  properties: {},
  transform(props) {
    return {
      position: 'relative',
      maxWidth: '8xl',
      mx: 'auto',
      px: { base: '4', md: '6', lg: '8' },
      ...props,
    }
  },
})

const center = definePattern({
  properties: {
    inline: { type: 'boolean' },
  },
  transform(props) {
    const { inline, ...rest } = props
    return {
      display: inline ? 'inline-flex' : 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...rest,
    }
  },
})

const aspectRatio = definePattern({
  properties: {
    ratio: { type: 'number' },
  },
  blocklist: ['aspectRatio'],
  transform(props) {
    const { ratio, ...rest } = props
    return {
      aspectRatio: ratio,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      '&>img, &>video': {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      },
      ...rest,
    }
  },
})

const divider = definePattern({
  properties: {
    orientation: { type: 'enum', value: ['horizontal', 'vertical'] },
    thickness: { type: 'token', value: 'sizes', property: 'borderWidth' },
    color: { type: 'token', value: 'colors', property: 'borderColor' },
  },
  transform(props, { map }) {
    const { orientation = 'horizontal', thickness = '1px', color, ...rest } = props
    return {
      '--thickness': thickness,
      width: map(orientation, (v) => (v === 'vertical' ? undefined : '100%')),
      height: map(orientation, (v) => (v === 'horizontal' ? undefined : '100%')),
      borderInlineStartWidth: map(orientation, (v) => (v === 'horizontal' ? 'var(--thickness)' : undefined)),
      borderInlineEndWidth: map(orientation, (v) => (v === 'vertical' ? 'var(--thickness)' : undefined)),
      borderColor: color,
      ...rest,
    }
  },
})

type Dict = Record<string, any>

const float = definePattern({
  properties: {
    offsetX: { type: 'token', value: 'spacing', property: 'left' },
    offsetY: { type: 'token', value: 'spacing', property: 'top' },
    offset: { type: 'token', value: 'spacing', property: 'top' },
    placement: {
      type: 'enum',
      value: [
        'bottom-end',
        'bottom-start',
        'top-end',
        'top-start',
        'bottom-center',
        'top-center',
        'middle-center',
        'middle-end',
        'middle-start',
      ],
    },
  },
  transform(props, { map }) {
    const { offset = '0', offsetX = offset, offsetY = offset, placement = 'top-end', ...rest } = props
    return {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      insetBlockStart: map(placement, (v) => {
        const [side] = v.split('-')
        const map: Dict = { top: offsetY, middle: '50%', bottom: 'auto' }
        return map[side]
      }),
      insetBlockEnd: map(placement, (v) => {
        const [side] = v.split('-')
        const map: Dict = { top: 'auto', middle: '50%', bottom: offsetY }
        return map[side]
      }),
      insetInlineStart: map(placement, (v) => {
        const [, align] = v.split('-')
        const map: Dict = { start: offsetX, center: '50%', end: 'auto' }
        return map[align]
      }),
      insetInlineEnd: map(placement, (v) => {
        const [, align] = v.split('-')
        const map: Dict = { start: 'auto', center: '50%', end: offsetX }
        return map[align]
      }),
      translate: map(placement, (v) => {
        const [side, align] = v.split('-')
        const mapX: Dict = { start: '-50%', center: '-50%', end: '50%' }
        const mapY: Dict = { top: '-50%', middle: '-50%', bottom: '50%' }
        return `${mapX[align]} ${mapY[side]}`
      }),
      ...rest,
    }
  },
})

const join = definePattern({
  properties: {
    orientation: { type: 'enum', value: ['horizontal', 'vertical'] },
  },
  transform(props, { map }) {
    const { orientation = 'horizontal', ...rest } = props

    return {
      display: 'inline-flex',
      alignItems: 'stretch',
      flexDirection: map(orientation, (v) => (v === 'vertical' ? 'column' : 'row')),

      '& > *:focus': {
        isolation: 'isolate',
      },

      '& > *:not(:first-child):not(:last-child)': {
        borderTopRightRadius: '0',
        borderBottomRightRadius: '0',
        borderBottomLeftRadius: '0',
        borderTopLeftRadius: '0',
      },

      '& > :where(*:not(:first-child))': {
        mt: map(orientation, (v) => (v === 'vertical' ? '-1px' : '0')),
        mr: map(orientation, (v) => (v === 'vertical' ? '0' : undefined)),
        mb: map(orientation, (v) => (v === 'horizontal' ? '0' : undefined)),
        ml: map(orientation, (v) => (v === 'horizontal' ? '-1px' : '0')),
      },

      '& > *:first-child:not(:last-child)': {
        borderBottomLeftRadius: map(orientation, (v) => (v === 'vertical' ? '0' : 'inherit')),
        borderBottomRightRadius: '0',
        borderTopLeftRadius: 'inherit',
        borderTopRightRadius: map(orientation, (v) => (v === 'vertical' ? 'inherit' : '0')),
      },

      '& > *:last-child:not(:first-child)': {
        borderBottomLeftRadius: map(orientation, (v) => (v === 'vertical' ? 'inherit' : '0')),
        borderBottomRightRadius: 'inherit',
        borderTopLeftRadius: '0',
        borderTopRightRadius: map(orientation, (v) => (v === 'vertical' ? '0' : 'inherit')),
      },

      ...rest,
    }
  },
})

export const patterns = {
  box,
  flex,
  stack,
  vstack,
  hstack,
  spacer,
  square,
  circle,
  center,
  absoluteCenter,
  aspectRatio,
  grid,
  gridItem,
  wrap,
  container,
  divider,
  float,
  join,
}
