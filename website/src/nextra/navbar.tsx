import { css, cx } from '@/styled-system/css'
import { navbar } from '@/styled-system/recipes'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuTrigger,
  Portal
} from '@ark-ui/react'
import { useFSRoute } from 'nextra/hooks'
import { ArrowRightIcon, MenuIcon } from 'nextra/icons'
import type {
  Item,
  MenuItem as MenuItemData,
  PageItem
} from 'nextra/normalize-pages'
import { renderComponent } from './lib'
import { Anchor } from './anchor'
import { useConfig, useMenu } from './contexts'

export type NavBarProps = {
  flatDirectories: Item[]
  items: (PageItem | MenuItemData)[]
}

const classes = {
  link: css({ textStyle: 'sm' }),
  active: css({
    fontWeight: 'medium'
  }),
  inactive: css({
    color: 'gray.600',
    _hover: { color: 'gray.800' },
    _dark: { color: 'gray.400', _hover: { color: 'gray.200' } }
  })
}

type NavMenuProps = {
  className?: string
  menu: MenuItemData
  children: React.ReactNode
}

function NavbarMenu({ className, menu, children }: NavMenuProps) {
  const { items } = menu

  const routes = Object.fromEntries(
    (menu.children || []).map(route => [route.name, route])
  )

  return (
    <div className={css({ position: 'relative', display: 'inline-block' })}>
      <Menu>
        <MenuTrigger asChild>
          <button
            className={cx(
              className,
              css({
                ms: '-2',
                display: { base: 'none', md: 'inline-flex' },
                alignItems: 'center',
                whiteSpace: 'nowrap',
                rounded: 'md',
                p: '2'
              }),
              classes.inactive
            )}
          >
            {children}
          </button>
        </MenuTrigger>
        <Portal>
          <MenuPositioner className={css({ zIndex: 20 })}>
            <MenuContent
              className={css({
                mt: '1',
                maxHeight: '64',
                minWidth: 'full',
                overflow: 'auto',
                rounded: 'md',
                outline: '1px solid',
                outlineColor: {
                  base: 'rgb(0 0 0 / 0.05)',
                  _dark: 'rgb(255 255 255 / 0.2)'
                },
                bg: { base: 'white', _dark: 'neutral.800' },
                py: '1',
                textStyle: 'sm',
                shadow: 'lg'
              })}
              tabIndex={0}
            >
              {Object.entries(items || {}).map(([key, item]) => (
                <MenuItem id={key} key={key}>
                  <Anchor
                    href={
                      item.href || routes[key]?.route || menu.route + '/' + key
                    }
                    className={cx(
                      css({
                        position: 'relative',
                        display: { base: 'none', md: 'inline-block' },
                        w: 'full',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        color: 'gray.600',
                        _hover: { color: 'gray.900' },
                        _dark: {
                          color: 'gray.400',
                          _hover: { color: 'gray.100' }
                        },
                        py: 1.5,
                        transition: 'colors',
                        ps: '3',
                        pe: '9'
                      })
                    )}
                    newWindow={item.newWindow}
                  >
                    {item.title || key}
                  </Anchor>
                </MenuItem>
              ))}
            </MenuContent>
          </MenuPositioner>
        </Portal>
      </Menu>
    </div>
  )
}

export function Navbar({ flatDirectories, items }: NavBarProps) {
  const config = useConfig()
  const activeRoute = useFSRoute()
  const { menu, setMenu } = useMenu()

  return (
    <div
      data-scope="navbar"
      data-part="root"
      className={cx('nextra-nav-container', navbar())}
    >
      <div
        data-scope="navbar"
        data-part="blur"
        className={cx('nextra-nav-container-blur')}
      />
      <nav data-scope="navbar" data-part="nav">
        {config.logoLink ? (
          <Anchor
            data-scope="navbar"
            data-part="logo-link"
            href={typeof config.logoLink === 'string' ? config.logoLink : '/'}
            className={css({
              _hover: { opacity: 0.75 }
            })}
          >
            {renderComponent(config.logo)}
          </Anchor>
        ) : (
          <div data-scope="navbar" data-part="logo-link">
            {renderComponent(config.logo)}
          </div>
        )}
        {items.map(pageOrMenu => {
          if (pageOrMenu.display === 'hidden') return null

          if (pageOrMenu.type === 'menu') {
            const menu = pageOrMenu as MenuItemData

            const isActive =
              menu.route === activeRoute ||
              activeRoute.startsWith(menu.route + '/')

            return (
              <NavbarMenu
                data-scope="navbar"
                data-part="menu-link"
                key={menu.title}
                className={cx(isActive ? classes.active : classes.inactive)}
                menu={menu}
              >
                {menu.title}
                <ArrowRightIcon
                  data-scope="navbar"
                  data-part="menu-link-icon"
                  pathClassName={css({
                    transformOrigin: 'center',
                    transition: 'transform',
                    transform: 'rotate(0deg)'
                  })}
                />
              </NavbarMenu>
            )
          }
          const page = pageOrMenu as PageItem
          let href = page.href || page.route || '#'

          // If it's a directory
          if (page.children) {
            href =
              (page.withIndexPage ? page.route : page.firstChildRoute) || href
          }

          const isActive =
            page.route === activeRoute ||
            activeRoute.startsWith(page.route + '/')

          return (
            <Anchor
              data-scope="navbar"
              data-part="nav-link"
              href={href}
              key={href}
              className={cx(
                !isActive || page.newWindow ? classes.inactive : classes.active
              )}
              newWindow={page.newWindow}
              aria-current={!page.newWindow && isActive}
            >
              <span data-scope="navbar" data-part="nav-link-text">
                {page.title}
              </span>
              <span
                className={css({ visibility: 'hidden', fontWeight: '500' })}
              >
                {page.title}
              </span>
            </Anchor>
          )
        })}

        {renderComponent(config.search.component, {
          directories: flatDirectories,
          className: css({
            display: 'inline-block',
            hideBelow: 'sm',
            minW: '200px'
          })
        })}

        {config.project.link ? (
          <Anchor
            data-scope="navbar"
            data-part="project-link"
            className={css({
              p: 2,
              color: 'currentColor',
              '& svg': { width: '4' }
            })}
            href={config.project.link}
            newWindow
          >
            {renderComponent(config.project.icon)}
          </Anchor>
        ) : null}

        {config.chat.link ? (
          <Anchor
            data-scope="navbar"
            data-part="chat-link"
            className={css({ p: 2, color: 'currentColor' })}
            href={config.chat.link}
            newWindow
          >
            {renderComponent(config.chat.icon)}
          </Anchor>
        ) : null}

        {renderComponent(config.navbar.extraContent)}

        <button
          type="button"
          aria-label="Menu"
          data-scope="navbar"
          data-part="mobile-menu"
          onClick={() => setMenu(!menu)}
        >
          <MenuIcon className={cx(menu && 'open')} />
        </button>

        <div
          className={css({
            hideBelow: 'sm'
          })}
        >
          {config.darkMode &&
            renderComponent(config.themeSwitch.component, { lite: true })}
        </div>
      </nav>
    </div>
  )
}
