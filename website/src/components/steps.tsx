import type { ComponentProps, ReactElement } from 'react'
import cn from 'clsx'
import { css } from '../../styled-system/css'

export function Steps({
  children,
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn(
        'nextra-steps',
        css({
          ml: 4,
          mb: 12,
          borderLeft: '1px solid',
          borderLeftColor: 'gray.200',
          pl: 6,
          _dark: {
            borderColor: 'neutral.800'
          },
          counterReset: 'step'
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
