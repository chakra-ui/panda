import type { ComponentProps } from 'react'
import { css, cx } from '../../styled-system/css'

export const Tr = ({ className = '', ...props }: ComponentProps<'tr'>) => (
  <tr
    className={cx(
      css({
        m: '0',
        border: '1px solid token(colors.gray.300)',
        p: '0',
        _dark: {
          borderColor: 'gray.600'
        },
        _even: {
          bg: 'gray.100',
          _dark: {
            bg: 'gray.600/20'
          }
        }
      }),
      className
    )}
    {...props}
  />
)
