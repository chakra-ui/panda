import { Pattern } from '@css-panda/types'

export const patterns: Pattern[] = [
  {
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
  {
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
]
