import Link from 'next/link'
import { css } from '@/styled-system/css'

export const NavLink = (props: { href: string; children: React.ReactNode }) => {
  const { href, children } = props
  return (
    <Link
      href={href}
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
