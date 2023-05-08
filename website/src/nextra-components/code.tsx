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
          borderWidth: '0.04',
          bgOpacity: '0.03',
          bg: 'black',
          overflowWrap: 'break-word',
          borderRadius: 'md',
          border: '1px solid black',
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
