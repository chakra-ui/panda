import { panda } from '@/styled-system/jsx'
import { RecipeVariantProps, cva } from '@/styled-system/css'

const threeViewListStyle = cva({
  base: {
    position: 'relative',
  },
  variants: {
    root: {
      false: {
        _before: {
          position: 'absolute',
          insetY: 1,
          width: '1px',
          bg: 'gray.200',
          content: "''",
          _dark: { bg: 'neutral.800' }
        },
        _ltr: {
          pl: 3,
          _before: {
            left: 0
          }
        },
        _rtl: {
          pr: 3,
          _before: {
            right: 0
          }
        }
      }
    }
  },
  defaultVariants: {
    root: false
  }
})

export type ThreeViewListVariants = RecipeVariantProps<
  typeof threeViewListStyle
>

export const ThreeViewList = panda('ul', threeViewListStyle)
