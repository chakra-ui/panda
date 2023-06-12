import { panda } from '@/styled-system/jsx'
import { RecipeVariantProps, cva } from '@/styled-system/css'

const threeViewListStyle = cva({
  base: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
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
          _dark: {
            bg: 'whiteAlpha.200'
          }
        },
        _ltr: {
          pl: 3,
          ms: 3,
          _before: {
            left: 0
          }
        },
        _rtl: {
          pr: 3,
          me: 3,
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
