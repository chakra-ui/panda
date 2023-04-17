import type { AnyPatternConfig, PatternConfig } from '@pandacss/types'

// inlining this function to avoid having to depend on @pandacss/dev
function definePattern<Pattern>(config: PatternConfig<Pattern>) {
  return config as AnyPatternConfig
}

export const patterns = {
  stack: definePattern({
    properties: {
      align: { type: 'property', value: 'alignItems' },
      justify: { type: 'property', value: 'justifyContent' },
      direction: { type: 'property', value: 'flexDirection' },
      gap: { type: 'token', value: 'spacing' },
    },
    transform(props) {
      const { align = 'flex-start', justify, direction = 'column', gap = '10px' } = props
      return {
        display: 'flex',
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        minWidth: '0',
      }
    },
  }),

  absoluteCenter: definePattern({
    properties: {
      axis: { type: 'enum', value: ['x', 'y', 'both'] },
    },
    transform(props, { map }) {
      const { axis } = props
      return {
        position: 'absolute',
        top: map(axis, (v) => (v === 'x' ? 'auto' : '50%')),
        left: map(axis, (v) => (v === 'y' ? 'auto' : '50%')),
        transform: map(axis, (v) =>
          v === 'both' ? 'translate(-50%, -50%)' : v === 'x' ? 'translateX(-50%)' : 'translateY(-50%)',
        ),
      }
    },
  }),

  simpleGrid: definePattern({
    properties: {
      gap: { type: 'token', value: 'spacing' },
      columns: { type: 'number' },
      minChildWidth: { type: 'token', value: 'sizes', property: 'width' },
    },
    transform(props, { map }) {
      const { gap, columns, minChildWidth } = props
      return {
        display: 'grid',
        gridGap: gap,
        gridTemplateColumns: columns
          ? map(columns, (v) => `repeat(${v}, minmax(0, 1fr))`)
          : map(minChildWidth, (v) => `repeat(auto-fill, minmax(${v}, 1fr))`),
      }
    },
  }),

  gridItem: definePattern({
    properties: {
      colSpan: { type: 'number' },
    },
    transform(props, { map }) {
      const { colSpan } = props
      return {
        gridColumn: map(colSpan, (v) => (v ? `span ${v}` : 'auto')),
      }
    },
  }),
}
