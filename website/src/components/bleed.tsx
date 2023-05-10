import type { ReactElement, ReactNode } from 'react'
import { css, cx } from '../../styled-system/css'

export function Bleed({
  full,
  children
}: {
  full: boolean
  children: ReactNode
}): ReactElement {
  return (
    <div
      className={cx(
        'nextra-bleed',
        css({
          position: 'relative',
          mx: -6,
          mt: -6,
          md: { mx: -8 },
          '2xl': { mx: -24 }
        }),
        full &&
          css({
            _ltr: {
              xl: {
                ml: 'calc(50% - 50vw + 16rem)',
                mr: 'calc(50% - 50vw)'
              }
            },
            _rtl: {
              xl: {
                ml: 'calc(50% - 50vw)',
                mr: 'calc(50% - 50vw + 16rem)'
              }
            }
          })
      )}
    >
      {children}
    </div>
  )
}
