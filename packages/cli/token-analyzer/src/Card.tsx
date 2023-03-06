import { cva } from '../design-system/css'

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
})

export function Card() {
  return <div className={card({ size: 'sm', shape: 'square' })}>Hello</div>
}
