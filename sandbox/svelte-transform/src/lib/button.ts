import { cva } from '#styled-system/css'

export const button = cva({
  base: { px: '4', py: '2', rounded: 'md', fontWeight: 'semibold' },
  variants: {
    tone: {
      primary: { bg: 'blue.600', color: 'white' },
      danger: { bg: 'red.600', color: 'white' },
    },
  },
  defaultVariants: { tone: 'primary' },
})
