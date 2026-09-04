import { cva } from '../../styled-system/css'
import type { RecipeVariantProps } from '../../styled-system/types'

export const badge = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  variants: {
    tone: {
      brand: { backgroundColor: 'brand', color: 'surface' },
      muted: { backgroundColor: 'muted', color: 'surface' },
    },
  },
  defaultVariants: {
    tone: 'brand',
  },
})

export type BadgeProps = RecipeVariantProps<typeof badge>
