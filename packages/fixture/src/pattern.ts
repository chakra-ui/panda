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
      const { align, justify, direction, gap } = props
      return {
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
      }
    },
  },
]
