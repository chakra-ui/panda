'use client'

import { CourseBanner } from '@/components/course-banner'
import { CommandMenu } from '@/components/docs/command-menu'
import { SearchButton } from '@/components/docs/search'
import { Sidebar } from '@/components/docs/sidebar'
import { Anchor } from '@/components/ui/anchor'
import { drawerSlotRecipe } from '@/components/ui/drawer'
import { docsConfig } from '@/docs.config'
import { GithubIcon, MenuIcon } from '@/icons'
import { renderComponent } from '@/lib/render'
import { useMatchMedia } from '@/lib/use-match-media'
import { css, cx } from '@/styled-system/css'
import { Center } from '@/styled-system/jsx'
import { navbar } from '@/styled-system/recipes'
import { Icon } from '@/theme/icons'
import { Dialog, useDialog } from '@ark-ui/react/dialog'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
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
              _icon: { width: '4' }
            })}
            href={docsConfig.docsRepositoryBase}
            newWindow
          >
            <GithubIcon />
          </Anchor>
        ) : null}

        <ThemeSwitch />

        <MobileNavDrawer
          trigger={
            <button
              type="button"
              aria-label="Menu"
              data-scope="navbar"
              data-part="mobile-menu"
            >
              <MenuIcon />
            </button>
          }
        >
          <div className={css({ pt: '8' })}>
            <Sidebar slug={pathname} />
          </div>
        </MobileNavDrawer>
      </nav>
    </div>
  )
}

interface MobileNavDrawerProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

const MobileNavDrawer = (props: MobileNavDrawerProps) => {
  const { trigger, children } = props
  const dialog = useDialog()
  const classes = drawerSlotRecipe({ size: 'md', placement: 'start' })
  const pathname = usePathname()

  const isLgUp = useMatchMedia('(min-width: 1024px)')

  useEffect(() => {
    if (isLgUp && dialog.open) {
      dialog.setOpen(false)
    }
  }, [isLgUp, dialog.open])

  useEffect(() => {
    dialog.setOpen(false)
  }, [pathname])

  return (
    <Dialog.RootProvider value={dialog} lazyMount>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Backdrop className={classes.backdrop} />
      <Dialog.Positioner className={classes.positioner}>
        <Dialog.Content className={classes.content}>
          <div className={cx(classes.body, 'scroll-area')}>{children}</div>
          <Dialog.CloseTrigger className={classes.closeTrigger}>
            <Center width="5" height="5" color="fg">
              <Icon
                icon="Close"
                className={css({ width: '1em', height: 'auto' })}
              />
            </Center>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.RootProvider>
  )
}
