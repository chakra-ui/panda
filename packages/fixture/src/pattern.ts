import type { PatternConfig } from '@css-panda/types'

export const patterns: Record<string, PatternConfig> = {
  stack: {
    name: 'stack',
    properties: {
      align: { type: 'cssProp', value: 'alignItems' },
      justify: { type: 'cssProp', value: 'justifyContent' },
      direction: { type: 'cssProp', value: 'flexDirection' },
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
  },

  absoluteCenter: {
    name: 'absoluteCenter',
    properties: {
      axis: { type: 'enum', value: ['x', 'y', 'both'] },
    },
    transform(props) {
      const { axis } = props
      return {
        position: 'absolute',
        top: axis === 'x' ? 'auto' : '50%',
        left: axis === 'y' ? 'auto' : '50%',
        transform: axis === 'both' ? 'translate(-50%, -50%)' : axis === 'x' ? 'translateX(-50%)' : 'translateY(-50%)',
      }
    },
  },

  simpleGrid: {
    name: 'simpleGrid',
    properties: {
      gap: { type: 'token', value: 'spacing' },
      columns: { type: 'number' },
      minChildWidth: { type: 'token', value: 'sizes', cssProp: 'width' },
    },
    transform(props, { map }) {
      const { gap, columns, minChildWidth } = props
      return {
        display: 'grid',
        gridGap: gap,
        gridTemplateColumns: columns
          ? map(columns, (value) => `repeat(${value}, minmax(0, 1fr))`)
          : map(minChildWidth, (value) => `repeat(auto-fill, minmax(${value}, 1fr))`),
      }
    },
  },

  gridItem: {
    name: 'gridItem',
    properties: {
      colSpan: { type: 'number' },
    },
    transform(props) {
      const { colSpan } = props
      return {
        gridColumn: colSpan ? `span ${colSpan}` : 'auto',
      }
    },
  },
}
