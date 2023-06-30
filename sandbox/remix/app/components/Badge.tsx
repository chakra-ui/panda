import { styled } from 'styled-system/jsx'
import { cva } from 'styled-system/css'

export const badge = cva({
  base: {
    fontWeight: 'medium',
    letterSpacing: 'wide',
    flexGrow: '0',
    px: '3',
    alignSelf: 'flex-start',
    borderRadius: 'md',
  },
  variants: {
    status: {
      default: {
        color: 'white',
        bg: 'gray.500',
      },
      success: {
        color: 'white',
        bg: 'green.500',
      },
      warning: {
        color: 'white',
        bg: 'yellow.500',
      },
    },
  },
  defaultVariants: {
    status: 'default',
  },
})

export const Badge = styled('span', badge)
