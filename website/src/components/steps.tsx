import type { ComponentProps, ReactElement } from 'react'
import { css, cx } from '../../styled-system/css'

export function Steps({
  children,
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cx(
        'nextra-steps',
        css({
          ml: 4,
          mb: 12,
          borderLeft: '1px solid token(colors.gray.200)',
          pl: 6,
          _dark: {
            borderColor: 'neutral.800'
          },
          counterReset: 'step',
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
