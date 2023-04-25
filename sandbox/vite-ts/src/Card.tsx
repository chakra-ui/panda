import { cva } from '../styled-system/css'
import { panda } from '../styled-system/jsx'

const card = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    _hover: {
      color: 'red.200',
    },
  },
  variants: {
    size: {
      xs: {
        width: '5',
        height: '6',
      },
      sm: {
        width: '12',
        height: '12',
        _hover: {
          bg: 'red.50',
        },
      },
    },
    open: {
      true: {
        animationName: 'red',
      },
    },
    shape: {
      square: {
        borderRadius: '8px',
      },
      circle: {
        borderRadius: '999px',
      },
    },
  },
  compoundVariants: [
    {
      shape: 'square',
      size: ['xs', 'sm'],
      css: { color: 'yellow.300', backgroundColor: 'blue' },
    },
    {
      open: true,
      shape: ['square', 'circle'],
      css: { color: 'blue.300', backgroundColor: 'yellow' },
    },
  ],
})

export const Card = panda('section', card)
