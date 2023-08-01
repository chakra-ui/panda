import { panda } from '@/styled-system/jsx'
import { RecipeVariantProps, cva } from '@/styled-system/css'

export const threeViewLinkStyle = cva({
  base: {
    display: 'flex',
    rounded: 'md',
    px: 2,
    py: 1.5,
    textStyle: 'sm',
    transition: 'colors',
    wordBreak: 'break-word',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none'
  },
  variants: {
    active: {
      true: {
        bg: 'yellow.200',
        fontWeight: 'semibold',
        color: 'black',
        _dark: {
          bg: 'yellow.300'
        }
      },
      false: {
        color: 'gray.500',
        _hover: {
          bg: 'gray.100',
          color: 'gray.900'
        },
        _dark: {
          color: 'neutral.500',
          _hover: {
            bg: 'whiteAlpha.200',
            color: 'gray.50'
          }
        }
      }
    }
  }
})

export type TreeViewLinkVariants = RecipeVariantProps<typeof threeViewLinkStyle>

export const TreeViewLink = panda('a', threeViewLinkStyle)
