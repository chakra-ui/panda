import Link from 'next/link'
import { css } from '@/styled-system/css'

export const NavLink = (props: { href: string; externalLink?: boolean; children: React.ReactNode }) => {
  const { href, externalLink, children } = props
  return (
    <Link
      href={href}
      target={externalLink ? "_blank" : "_self"}
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
