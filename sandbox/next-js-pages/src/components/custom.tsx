import { sva } from '../../styled-system/css'
import { createStyleContext } from '../../styled-system/jsx'
import { custom } from '../../styled-system/recipes'

const _custom = sva({
  slots: ['root', 'label'],
  className: 'x-custom',
  base: {
    root: {
      color: 'red',
      bg: 'red.300',
    },
    label: {
      fontWeight: 'medium',
    },
  },
  variants: {
    size: {
      sm: {
        root: {
          padding: '10px',
        },
      },
      md: {
        root: {
          padding: '20px',
        },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})

const { withProvider, withContext } = createStyleContext(custom)

export const Root = withProvider('div', 'root', { defaultProps: { className: 'group' } })
export const Label = withContext('label', 'label', { defaultProps: { className: 'group__item' } })
