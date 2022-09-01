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
]
