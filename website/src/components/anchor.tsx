import { css } from '@/styled-system/css'
import NextLink from 'next/link'
import next from 'next/package.json'
import { forwardRef } from 'react'
import { useConfig } from '../contexts'

export type AnchorProps = Omit<React.ComponentProps<'a'>, 'ref'> & {
  newWindow?: boolean
}

const nextVersion = Number(next.version.split('.')[0])

export const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(function (
  { href = '', children, newWindow, ...props },
  ref
) {
  const config = useConfig()

  if (newWindow) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
        <span className={css({ srOnly: true })}> (opens in a new tab)</span>
      </a>
    )
  }

  if (!href) {
    return (
      <a ref={ref} {...props}>
        {children}
      </a>
    )
  }

  if (href.startsWith('#')) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    )
  }

  if (nextVersion > 12 || config.newNextLinkBehavior) {
    return (
      <NextLink ref={ref} href={href} {...props}>
        {children}
      </NextLink>
    )
  }

  return (
    <NextLink href={href} passHref>
      <a ref={ref} {...props}>
        {children}
      </a>
    </NextLink>
  )
})

Anchor.displayName = 'Anchor'
