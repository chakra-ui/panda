import type { PatternConfig } from '@pandacss/types'

function definePattern<T extends PatternConfig>(config: T) {
  return config
}

const box = definePattern({
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
  defaultValues: {
    direction: 'column',
    gap: '10px',
  },
  transform(props) {
    const { align, justify, direction, gap, ...rest } = props
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
  jsxName: 'VStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'property', value: 'gap' },
  },
  defaultValues: {
    gap: '10px',
  },
  transform(props) {
    const { justify, gap, ...rest } = props
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
  jsxName: 'HStack',
  properties: {
    justify: { type: 'property', value: 'justifyContent' },
    gap: { type: 'property', value: 'gap' },
  },
  defaultValues: {
    gap: '10px',
  },
  transform(props) {
    const { justify, gap, ...rest } = props
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

const grid = definePattern({
  properties: {
    gap: { type: 'property', value: 'gap' },
    columnGap: { type: 'property', value: 'gap' },
    rowGap: { type: 'property', value: 'gap' },
    columns: { type: 'number' },
    minChildWidth: { type: 'token', value: 'sizes', property: 'width' },
  },
  defaultValues(props) {
    return { gap: props.columnGap || props.rowGap ? undefined : '10px' }
  },
  transform(props, { map, isCssUnit }) {
    const { columnGap, rowGap, gap, columns, minChildWidth, ...rest } = props
    const getValue = (v: string) => (isCssUnit(v) ? v : `token(sizes.${v}, ${v})`)
    return {
      display: 'grid',
      gridTemplateColumns:
        columns != null
          ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`)
          : minChildWidth != null
            ? map(minChildWidth, (v) => `repeat(auto-fit, minmax(${getValue(v)}, 1fr))`)
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
      gridColumnStart: colStart,
      gridColumnEnd: colEnd,
      gridRowStart: rowStart,
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
  transform(props, { map }) {
    const { ratio = 4 / 3, ...rest } = props
    return {
      position: 'relative',
      _before: {
        content: `""`,
        display: 'block',
        height: '0',
        paddingBottom: map(ratio, (r: any) => `${(1 / r) * 100}%`),
      },
      '&>*': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
      },
      '&>img, &>video': {
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
  defaultValues: {
    orientation: 'horizontal',
    thickness: '1px',
  },
  transform(props, { map }) {
    const { orientation, thickness, color, ...rest } = props
    return {
      '--thickness': thickness,
      width: map(orientation, (v) => (v === 'vertical' ? undefined : '100%')),
      height: map(orientation, (v) => (v === 'horizontal' ? undefined : '100%')),
      borderBlockEndWidth: map(orientation, (v) => (v === 'horizontal' ? 'var(--thickness)' : undefined)),
      borderInlineEndWidth: map(orientation, (v) => (v === 'vertical' ? 'var(--thickness)' : undefined)),
      borderColor: color,
      ...rest,
    }
  },
})

const linkBox = definePattern({
  transform(props) {
    return {
      position: 'relative',
      '& :where(a, abbr)': {
        position: 'relative',
        zIndex: '1',
      },
      ...props,
    }
  },
})

const linkOverlay = definePattern({
  jsxElement: 'a',
  transform(props) {
    return {
      position: 'static',
      _before: {
        content: '""',
        display: 'block',
        position: 'absolute',
        cursor: 'inherit',
        inset: '0',
        zIndex: '0',
        ...props['_before'],
      },
      ...props,
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
  defaultValues(props) {
    const offset = props.offset || '0'
    return { offset, offsetX: offset, offsetY: offset, placement: 'top-end' }
  },
  transform(props, { map }) {
    const { offset, offsetX, offsetY, placement, ...rest } = props
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

const bleed = definePattern({
  properties: {
    inline: { type: 'property', value: 'marginInline' },
    block: { type: 'property', value: 'marginBlock' },
  },
  defaultValues: {
    inline: '0',
    block: '0',
  },
  transform(props, { map, isCssUnit, isCssVar }) {
    const { inline, block, ...rest } = props
    const valueFn = (v: string) => (isCssUnit(v) || isCssVar(v) ? v : `token(spacing.${v}, ${v})`)
    return {
      '--bleed-x': map(inline, valueFn),
      '--bleed-y': map(block, valueFn),
      marginInline: 'calc(var(--bleed-x, 0) * -1)',
      marginBlock: 'calc(var(--bleed-y, 0) * -1)',
      ...rest,
    }
  },
})

const visuallyHidden = definePattern({
  transform(props) {
    return {
      srOnly: true,
      ...props,
    }
  },
})

const cq = definePattern({
  properties: {
    name: { type: 'token', value: 'containerNames', property: 'containerName' },
    type: { type: 'property', value: 'containerType' },
  },
  defaultValues: {
    type: 'inline-size',
  },
  transform(props) {
    const { name, type, ...rest } = props
    return {
      containerType: type,
      containerName: name,
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
  linkBox,
  linkOverlay,
  aspectRatio,
  grid,
  gridItem,
  wrap,
  container,
  divider,
  float,
  bleed,
  visuallyHidden,
  cq,
}
