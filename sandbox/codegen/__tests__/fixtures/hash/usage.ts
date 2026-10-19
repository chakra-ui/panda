import { css, cva, sva } from '../../../styled-system-hash/css'
import { button, buttonWithCompoundVariants, slotButton } from '../../../styled-system-hash/recipes'

const card = cva({
  base: { display: 'flex' },
  variants: { size: { sm: { gap: '2' }, lg: { gap: '4' } } },
})

const field = sva({
  slots: ['root', 'label'],
  base: { root: { display: 'grid' }, label: { fontWeight: 'bold' } },
  variants: { tone: { muted: { label: { color: 'gray.500' } } } },
})

export const usage = {
  css: css({ padding: '4', _hover: { color: 'red.500' }, md: { margin: '2' } }),
  cva: card({ size: 'lg' }),
  sva: field({ tone: 'muted' }),
  recipeBase: button(),
  recipeVariant: button({ visual: 'solid' }),
  recipeCompound: buttonWithCompoundVariants({ visual: 'outline', size: 'md' }),
  recipeArrayCompound: buttonWithCompoundVariants({ visual: 'outline', size: 'lg' }),
  slotRecipe: slotButton({ visual: 'outline' }),
}
