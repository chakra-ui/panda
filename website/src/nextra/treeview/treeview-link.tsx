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
        color: 'black',
        bg: { base: 'yellow.200', _dark: 'yellow.300' },
        fontWeight: 'semibold'
      },
      false: {
        color: {
          base: 'gray.500',
          _hover: 'gray.900',
          _dark: { base: 'gray.400', _hover: 'gray.50' }
        },

        _hover: {
          bg: { base: 'gray.100', _dark: 'whiteAlpha.200' }
        }
      }
    }
  }
})

export type TreeViewLinkVariants = RecipeVariantProps<typeof threeViewLinkStyle>

export const TreeViewLink = panda('a', threeViewLinkStyle)
