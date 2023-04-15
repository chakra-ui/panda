import type { PatternConfig } from '@pandacss/types'

const box: PatternConfig = {
  properties: {},
  transform(props) {
    return props
  },
}

const flex: PatternConfig = {
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
}

const stack: PatternConfig = {
  properties: {
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
    direction: { type: 'property', value: 'flexDirection' },
    gap: { type: 'property', value: 'gap' },
  },
  blocklist: ['flexDirection'],
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
}

const vstack: PatternConfig = {
  jsx: 'VStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'property', value: 'gap' },
  },
  blocklist: ['flexDirection'],
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
}

const hstack: PatternConfig = {
  jsx: 'HStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'property', value: 'gap' },
  },
  blocklist: ['flexDirection'],
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
}

const spacer: PatternConfig = {
  properties: {
    size: { type: 'token', value: 'spacing' },
  },
  transform(props, { map }) {
    const { axis, size, ...rest } = props
    return {
      alignSelf: 'stretch',
      justifySelf: 'stretch',
      flex: map(size, (v) => (v == null ? '1' : `0 0 ${v}`)),
      ...rest,
    }
  },
}

const circle: PatternConfig = {
  properties: {
    size: { type: 'property', value: 'width' },
  },
  blocklist: ['width', 'height', 'borderRadius'],
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
}

const absoluteCenter: PatternConfig = {
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
}

const grid: PatternConfig = {
  properties: {
    gap: { type: 'property', value: 'gap' },
    gapX: { type: 'property', value: 'gap' },
    gapY: { type: 'property', value: 'gap' },
    columns: { type: 'number' },
    minChildWidth: { type: 'token', value: 'sizes', property: 'width' },
  },
  transform(props, { map }) {
    const { gapX, gapY, gap = gapX || gapY ? undefined : '10px', columns, minChildWidth, ...rest } = props
    return {
      gridTemplateColumns:
        columns != null
          ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`)
          : minChildWidth != null
          ? map(minChildWidth, (v) => `repeat(auto-fit, minmax(${v}, 1fr))`)
          : undefined,
      display: 'grid',
      gap,
      columnGap: gapX,
      rowGap: gapY,
      ...rest,
    }
  },
}

const gridItem: PatternConfig = {
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
}

const wrap: PatternConfig = {
  properties: {
    gap: { type: 'property', value: 'gap' },
    gapX: { type: 'property', value: 'gap' },
    gapY: { type: 'property', value: 'gap' },
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
  },
  transform(props) {
    const { gapX, gapY, gap = gapX || gapY ? undefined : '10px', align, justify, ...rest } = props
    return {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: align,
      justifyContent: justify,
      gap,
      columnGap: gapX,
      rowGap: gapY,
      ...rest,
    }
  },
}

const container: PatternConfig = {
  properties: {
    size: { type: 'token', value: 'breakpoints' },
  },
  transform(props, { map }) {
    const { size, ...rest } = props
    return {
      position: 'relative',
      width: '100%',
      maxWidth: size != null ? map(size, (v) => `breakpoint-${v}`) : '60ch',
      marginX: 'auto',
      ...rest,
    }
  },
}

const center: PatternConfig = {
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
}

const aspectRatio: PatternConfig = {
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
}

export const patterns = {
  box,
  flex,
  stack,
  vstack,
  hstack,
  spacer,
  circle,
  center,
  absoluteCenter,
  aspectRatio,
  grid,
  gridItem,
  wrap,
  container,
}
