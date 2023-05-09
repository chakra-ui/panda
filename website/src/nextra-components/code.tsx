import type { ComponentProps, ReactElement } from 'react'
import { css } from '../../styled-system/css'

export const Code = ({
  children,
  className = '',
  ...props
}: ComponentProps<'code'>): ReactElement => {
  const hasLineNumbers = 'data-line-numbers' in props
  return (
    <code
      className={[
        css({
          borderWidth: '1px',
          borderColor: 'rgba(0, 0, 0, 0.04)',
          bg: 'rgba(0, 0, 0, 0.03)',
          overflowWrap: 'break-word',
          borderRadius: 'md',
          py: '0.5',
          px: '.25em',
          fontSize: '.9em',
          _dark: {
            border: 'rgba(255, 255, 255, 0.1)',
            bg: 'rgba(255, 255, 255, 0.1)'
          }
        }),
        hasLineNumbers ? css({ counterReset: 'line' }) : '',
        className
      ].join(' ')}
      // always show code blocks in ltr
      dir="ltr"
      {...props}
    >
      {children}
    </code>
  )
}
