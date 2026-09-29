import { cva } from '@panda/css'

export const button = cva({
  base: { bg: 'red' },
  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '16px' } } },
  defaultVariants: { size: 'sm' },
})
