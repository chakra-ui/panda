import Link from 'next/link'
import { css } from '@/styled-system/css'

type Props = {
  href: string
  isExternal?: boolean
  children: React.ReactNode
}

export const NavLink = (props: Props) => {
  const { href, isExternal, children } = props
  return (
    <Link
      href={href}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener' : undefined}
      className={css({
        px: '2',
        py: '1',
        textStyle: 'xl',
        fontWeight: 'semibold',
        letterSpacing: 'tight',
        _hover: {
          bg: 'bg.emphasized.hover'
        }
      })}
    >
      {children}
    </Link>
  )
}
