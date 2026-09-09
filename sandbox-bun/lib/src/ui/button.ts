import { cva } from '../../styled-system/css'
import type { RecipeVariantProps } from '../../styled-system/types'

export const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontWeight: '600',
  },
  variants: {
    tone: {
      brand: { backgroundColor: 'brand', color: 'surface' },
      plain: { backgroundColor: 'surface', color: 'ink' },
    },
    size: {
      sm: { padding: '4px 12px', fontSize: '14px' },
      md: { padding: '8px 16px', fontSize: '16px' },
    },
  },
  defaultVariants: {
    tone: 'brand',
    size: 'md',
  },
})

export type ButtonProps = RecipeVariantProps<typeof button>
