import { sva } from '../styled-system/css'

const button = sva({
  slots: ['label', 'icon'],
  base: {
    label: {
      color: 'red',
      textDecoration: 'underline',
    },
  },
  variants: {
    rounded: {
      true: {},
    },
    size: {
      sm: {
        label: {
          fontSize: 'sm',
        },
        icon: {
          fontSize: 'sm',
        },
      },
      lg: {
        label: {
          fontSize: 'lg',
        },
        icon: {
          fontSize: 'lg',
          color: 'pink',
        },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
  compoundVariants: [
    {
      size: 'lg',
      rounded: true,
      css: {
        label: {
          textTransform: 'uppercase',
        },
      },
    },
  ],
})

export function App() {
  const classes = button({ size: 'lg', rounded: true })
  return (
    <>
      <button>
        <span className={classes.label}>Label</span>
        <span className={classes.icon}>Icon</span>
      </button>
    </>
  )
}
