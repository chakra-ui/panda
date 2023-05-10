import type { ComponentProps } from 'react'
import { css, cx } from '../../styled-system/css'

export const Td = ({ className = '', ...props }: ComponentProps<'td'>) => (
  <td
    className={cx(
      css({
        m: '0',
        border: '1px solid token(colors.gray.300)',
        px: '4',
        py: '2',
        _dark: {
          borderColor: 'gray.600'
        }
      }),
      className
    )}
    {...props}
  />
)
