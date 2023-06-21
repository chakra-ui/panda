import { panda } from '@/styled-system/jsx'
import { RecipeVariantProps, cva } from '@/styled-system/css'

const threeViewListStyle = cva({
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
        _before: {
          position: 'absolute',
          insetY: '1',
          width: '1px',
          bg: 'gray.200',
          content: "''",
          insetStart: '0',
          _dark: {
            bg: 'whiteAlpha.200'
          }
        }
      }
    }
  },
  defaultVariants: {
    root: false
  }
})

export type TreeViewListVariants = RecipeVariantProps<typeof threeViewListStyle>

export const TreeViewList = panda('ul', threeViewListStyle)
