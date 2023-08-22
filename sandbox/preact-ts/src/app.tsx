import { sva } from '../styled-system/css'
import { card } from '../styled-system/recipes'

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
  const btnClass = button({ size: 'lg', rounded: true })
  const cardClass = card()

  return (
    <div>
      <div class={cardClass.root}>
        <p class={cardClass.label}> Card / Label</p>
        <p class={cardClass.icon}> Card / Icon</p>
      </div>

      <button>
        <span class={btnClass.label}>Button Label</span>
      </button>
    </div>
  )
}
