'use client'

import { CourseBanner } from '@/components/course-banner'
import { CommandMenu } from '@/components/docs/command-menu'
import { SearchButton } from '@/components/docs/search'
import { Anchor } from '@/components/ui/anchor'
import { docsConfig } from '@/docs.config'
import { GithubIcon, MenuIcon } from '@/icons'
import { renderComponent } from '@/lib/render'
import { useMenu } from '@/mdx/contexts'
import { css, cx } from '@/styled-system/css'
import { navbar } from '@/styled-system/recipes'
import { Icon } from '@/theme/icons'
import { usePathname } from 'next/navigation'
import { ThemeSwitch } from './theme-switch'

const classes = {
  link: css({ textStyle: 'sm' }),
  active: css({
    fontWeight: 'medium'
  }),
  inactive: css({
    color: 'fg.muted',
    _hover: { color: 'fg' }
  })
}

export const Navbar = () => {
  const pathname = usePathname()
  const { menu, setMenu } = useMenu()
  const items = docsConfig.navigation

  return (
    <div data-scope="navbar" data-part="root" className={navbar()}>
      <div data-scope="navbar" data-part="blur" />

      <CourseBanner />

      <nav data-scope="navbar" data-part="nav">
        {docsConfig.logoUrl ? (
          <Anchor
            data-scope="navbar"
            data-part="logo-link"
            href={
              typeof docsConfig.logoUrl === 'string' ? docsConfig.logoUrl : '/'
            }
            className={css({
              _hover: { opacity: 0.75 }
            })}
          >
            {renderComponent(docsConfig.logo)}
          </Anchor>
        ) : (
          <div data-scope="navbar" data-part="logo-link">
            <Icon icon="LogoWithText" />
          </div>
        )}

        {items.map(item => {
          const active =
            item.href === pathname || pathname?.startsWith(item.href + '/')
          return (
            <Anchor
              data-scope="navbar"
              data-part="nav-link"
              href={item.href}
              key={item.href}
              className={cx(
                !active || item.newWindow ? classes.inactive : classes.active
              )}
              newWindow={item.newWindow}
              aria-current={!item.newWindow && active}
            >
              <span data-scope="navbar" data-part="nav-link-text">
                {item.title}
              </span>
              <span
                className={css({ visibility: 'hidden', fontWeight: '500' })}
              >
                {item.title}
              </span>
            </Anchor>
          )
        })}

        <CommandMenu trigger={<SearchButton />} mediaQuery="max-width: 640px" />

        {docsConfig.docsRepositoryBase ? (
          <Anchor
            data-scope="navbar"
            data-part="project-link"
            className={css({
              p: 2,
              color: 'currentColor',
              '& svg': { width: '4' }
            })}
            href={docsConfig.docsRepositoryBase}
            newWindow
          >
            <GithubIcon />
          </Anchor>
        ) : null}

        <button
          type="button"
          aria-label="Menu"
          data-scope="navbar"
          data-part="mobile-menu"
          onClick={() => setMenu(!menu)}
        >
          <MenuIcon className={cx(menu && 'open')} />
        </button>

        <div className={css({ hideBelow: 'sm' })}>
          <ThemeSwitch lite />
        </div>
      </nav>
    </div>
  )
}
