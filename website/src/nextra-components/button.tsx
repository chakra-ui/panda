import type { ComponentProps, ReactElement } from 'react'
import { css } from '../../styled-system/css'

export const Button = ({
  children,
  className = '',
  ...props
}: ComponentProps<'button'>): ReactElement => {
  return (
    <button
      className={[
        'nextra-button',
        css({
          bg: 'yellow.300',
          color: 'neutral.800',
          rounded: 'md',
          p: '1.5'
        }),
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
