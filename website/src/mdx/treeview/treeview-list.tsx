import { panda } from '@/styled-system/jsx'
import { RecipeVariantProps, cva } from '@/styled-system/css'

const treeViewListStyle = cva({
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '1'
  },
  variants: {
    root: {
      false: {
        paddingStart: '3',
        marginStart: '3',
        borderInlineStartWidth: '1px'
      }
    }
  },
  defaultVariants: {
    root: false
  }
})

export type TreeViewListVariants = RecipeVariantProps<typeof treeViewListStyle>

export const TreeViewList = panda('ul', treeViewListStyle)
