import { cva } from '../../styled-system/css'
import type { RecipeVariantProps } from '../../styled-system/types'

export const stack = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
  },
  variants: {
    gap: {
      sm: { gap: '8px' },
      md: { gap: '16px' },
      lg: { gap: '24px' },
    },
  },
  defaultVariants: {
    gap: 'md',
  },
})

export type StackProps = RecipeVariantProps<typeof stack>
