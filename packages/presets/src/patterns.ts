import type { PatternConfig } from '@pandacss/types'

const stack: PatternConfig = {
  properties: {
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
    direction: { type: 'property', value: 'flexDirection' },
    gap: { type: 'token', value: 'spacing' },
  },
  transform(props) {
    const { align = 'flex-start', justify, direction = 'column', gap = '10px', ...rest } = props
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
    gap: { type: 'token', value: 'spacing' },
  },
  transform(props) {
    const { justify, gap = '10px', ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      ...rest,
      flexDirection: 'column',
    }
  },
}

const hstack: PatternConfig = {
  jsx: 'HStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'token', value: 'spacing' },
  },
  transform(props) {
    const { justify, gap = '10px', ...rest } = props
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      ...rest,
      flexDirection: 'row',
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
      ...rest,
      alignSelf: 'stretch',
      justifySelf: 'stretch',
      flex: map(size, (v) => (v == null ? '1' : `0 0 ${v}`)),
    }
  },
}

const circle: PatternConfig = {
  properties: {
    size: { type: 'token', value: 'sizes' },
  },
  transform(props) {
    const { size, ...rest } = props
    return {
      ...rest,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius: '9999px',
      flex: '0 0 auto',
    }
  },
}

const absoluteCenter: PatternConfig = {
  properties: {
    axis: { type: 'enum', value: ['x', 'y', 'both'] },
  },
  transform(props, { map }) {
    const { axis, ...rest } = props
    return {
      ...rest,
      position: 'absolute',
      top: map(axis, (v) => (v === 'x' ? 'auto' : '50%')),
      left: map(axis, (v) => (v === 'y' ? 'auto' : '50%')),
      transform: map(axis, (v) =>
        v === 'both' ? 'translate(-50%, -50%)' : v === 'x' ? 'translateX(-50%)' : 'translateY(-50%)',
      ),
    }
  },
}

const grid: PatternConfig = {
  properties: {
    gap: { type: 'token', value: 'spacing' },
    columns: { type: 'number' },
    minChildWidth: { type: 'token', value: 'sizes', property: 'width' },
  },
  transform(props, { map }) {
    const { gap, columns, minChildWidth, ...rest } = props
    return {
      ...rest,
      display: 'grid',
      gridGap: gap,
      gridTemplateColumns: columns
        ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`)
        : map(minChildWidth, (v) => `repeat(auto-fit, minmax(${v}, 1fr))`),
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
    return {
      ...rest,
      gridColumn: map(colSpan, (v) => (v === 'auto' ? v : `span ${v}`)),
      gridRow: map(rowSpan, (v) => (v === 'auto' ? v : `span ${v}`)),
      gridColumnEnd: colEnd,
      gridRowEnd: rowEnd,
    }
  },
}

const wrap: PatternConfig = {
  properties: {
    gap: { type: 'token', value: 'spacing' },
    gapX: { type: 'token', value: 'spacing' },
    gapY: { type: 'token', value: 'spacing' },
    align: { type: 'property', value: 'alignItems' },
    justify: { type: 'property', value: 'justifyContent' },
  },
  transform(props) {
    const { gapX, gapY, gap = gapX || gapY ? undefined : '10px', align, justify, ...rest } = props
    return {
      ...rest,
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: align,
      justifyContent: justify,
      gap,
      columnGap: gapX,
      rowGap: gapY,
    }
  },
}

const container: PatternConfig = {
  properties: {
    size: { type: 'token', value: 'sizes' },
    centerContent: { type: 'boolean' },
  },
  transform(props) {
    const { size, centerContent, ...rest } = props
    return {
      ...rest,
      position: 'relative',
      width: '100%',
      maxWidth: size,
      marginX: 'auto',
      paddingX: centerContent ? '1rem' : undefined,
      ...(centerContent && { display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    }
  },
}

export const patterns = {
  stack,
  vstack,
  hstack,
  spacer,
  circle,
  absoluteCenter,
  grid,
  gridItem,
  wrap,
  container,
}
