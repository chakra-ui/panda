import type { ReactElement } from 'react'
import { ArrowRightIcon } from 'nextra/icons'
import { useConfig } from '../contexts'
import type { Item } from 'nextra/normalize-pages'
import { Anchor } from './anchor'
import type { DocsThemeConfig } from '../index'
import { navLinks } from '../../styled-system/recipes'

interface NavLinkProps {
  currentIndex: number
  flatDirectories: Item[]
}

export const NavLinks = ({
  flatDirectories,
  currentIndex
}: NavLinkProps): ReactElement | null => {
  const config = useConfig()
  const nav = config.navigation
  const navigation: Exclude<DocsThemeConfig['navigation'], boolean> =
    typeof nav === 'boolean' ? { prev: nav, next: nav } : nav
  let prev = navigation.prev && flatDirectories[currentIndex - 1]
  let next = navigation.next && flatDirectories[currentIndex + 1]

  // @ts-ignore
  if (prev && !prev.isUnderCurrentDocsTree) prev = false
  // @ts-ignore
  if (next && !next.isUnderCurrentDocsTree) next = false

  if (!prev && !next) return null

  return (
    <div data-scope="nav-links" data-part="root" className={navLinks()}>
      {prev && (
        <Anchor
          href={prev.route}
          title={prev.title}
          data-scope="nav-links"
          data-part="prev-lnik"
        >
          <ArrowRightIcon data-scope="nav-links" data-part="prev-icon" />
          {prev.title}
        </Anchor>
      )}
      {next && (
        <Anchor
          href={next.route}
          title={next.title}
          data-scope="nav-links"
          data-part="next-link"
        >
          {next.title}
          <ArrowRightIcon data-scope="nav-links" data-part="next-icon" />
        </Anchor>
      )}
    </div>
  )
}
