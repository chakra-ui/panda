import { css } from '@/styled-system/css'
import Link from 'next/link'
import { forwardRef } from 'react'

export interface AnchorProps extends Omit<React.ComponentProps<'a'>, 'ref'> {
  newWindow?: boolean
}

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(
  function Anchor(props, ref) {
    const { href = '', children, newWindow, ...rest } = props

    if (newWindow) {
      return (
        <a ref={ref} href={href} target="_blank" rel="noreferrer" {...rest}>
          {children}
          <span className={css({ srOnly: true })}> (opens in a new tab)</span>
        </a>
      )
    }

    if (!href) {
      return (
        <a ref={ref} {...rest}>
          {children}
        </a>
      )
    }

    if (href.startsWith('#')) {
      return (
        <a ref={ref} href={href} {...rest}>
          {children}
        </a>
      )
    }

    return (
      <Link ref={ref} href={href} {...rest}>
        {children}
      </Link>
    )
  }
)
