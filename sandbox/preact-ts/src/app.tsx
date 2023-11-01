import { css, sva } from '../styled-system/css'
import { card } from '../styled-system/recipes'
import { splitCssProps, styled } from '../styled-system/jsx'
import { HTMLStyledProps } from '../styled-system/types'

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

function SplitComponent({ children, ...props }: HTMLStyledProps<'div'>) {
  const [cssProps, restProps] = splitCssProps(props)
  console.log({ cssProps, restProps })
  return (
    <styled.div className={css({ display: 'flex', height: '20', width: '20' }, cssProps)} {...restProps}>
      {children}
    </styled.div>
  )
}

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
      <SplitComponent w="2" onClick={() => console.log('123')}>
        Click me
      </SplitComponent>
    </div>
  )
}
