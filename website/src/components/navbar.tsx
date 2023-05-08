import type { ReactElement, ReactNode } from 'react'
import cn from 'clsx'
import { Menu, Transition } from '@headlessui/react'
import { ArrowRightIcon, MenuIcon } from 'nextra/icons'

import { useConfig, useMenu } from '../contexts'
import type { Item, PageItem, MenuItem } from 'nextra/normalize-pages'
import { renderComponent } from '../utils'
import { useFSRoute } from 'nextra/hooks'
import { Anchor } from './anchor'
import { css, cx } from '../../styled-system/css'

export type NavBarProps = {
  flatDirectories: Item[]
  items: (PageItem | MenuItem)[]
}

const classes = {
  link: cn(
    css({
      textStyle: 'sm',
      _moreContrast: {
        color: 'gray.700',
        _dark: { color: 'gray.100' }
      }
    })
  ),
  active: css({
    fontSize: 'md',
    WebkitFontSmoothing: 'auto',
    MozOsxFontSmoothing: 'auto'
  }),
  inactive: css({
    color: 'gray.600',
    _hover: { color: 'gray.800' },
    _dark: { color: 'gray.400', _hover: { color: 'gray.200' } }
  })
}

function NavbarMenu({
  className,
  menu,
  children
}: {
  className?: string
  menu: MenuItem
  children: ReactNode
}): ReactElement {
  const { items } = menu
  const routes = Object.fromEntries(
    (menu.children || []).map(route => [route.name, route])
  )

  return (
    <div className={css({ position: 'relative', display: 'inline-block' })}>
      <Menu>
        <Menu.Button
          className={cn(
            className,
            css({
              ml: -2,
              display: 'none',
              alignItems: 'center',
              whitespace: 'nowrap',
              rounded: 'md',
              p: 2,
              md: { display: 'inline-flex' }
            }),
            classes.inactive
          )}
        >
          {children}
        </Menu.Button>
        <Transition
          leave={css({ transitionProperty: 'opacity' })}
          leaveFrom={css({ opacity: 1 })}
          leaveTo={css({ opacity: 0 })}
        >
          <Menu.Items
            className={css({
              position: 'absolute',
              right: 0,
              zIndex: 20,
              mt: 1,
              maxHeight: 64,
              minWidth: 'full',
              overflow: 'auto',
              rounded: 'md',
              outline: '1px solid',
              outlineColor: 'black/5',
              bgColor: 'white',
              py: 1,
              textStyle: 'sm',
              shadow: 'lg',
              _dark: {
                outlineColor: 'white/20',
                bgColor: 'neutral.800'
              }
            })}
            tabIndex={0}
          >
            {Object.entries(items || {}).map(([key, item]) => (
              <Menu.Item key={key}>
                <Anchor
                  href={
                    item.href || routes[key]?.route || menu.route + '/' + key
                  }
                  className={cn(
                    css({
                      position: 'relative',
                      display: 'none',
                      w: 'full',
                      userSelect: 'none',
                      whitespace: 'nowrap',
                      color: 'gray.600',
                      _hover: { color: 'gray.900' },
                      _dark: {
                        color: 'gray.400',
                        _hover: { color: 'gray.100' }
                      },
                      md: { display: 'inline-block' },
                      py: 1.5,
                      transitionProperty: 'color',
                      _ltr: { pl: 3, pr: 9 },
                      _rtl: { pr: 3, pl: 9 }
                    })
                  )}
                  newWindow={item.newWindow}
                >
                  {item.title || key}
                </Anchor>
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

export function Navbar({ flatDirectories, items }: NavBarProps): ReactElement {
  const config = useConfig()
  const activeRoute = useFSRoute()
  const { menu, setMenu } = useMenu()

  return (
    <div
      className={cx(
        'nextra-nav-container',
        css({
          position: 'sticky',
          top: 0,
          zIndex: 20,
          w: 'full',
          bg: 'transparent',
          _print: { display: 'none' }
        })
      )}
    >
      <div
        className={cn(
          'nextra-nav-container-blur',
          css({
            pointerEvents: 'none',
            position: 'absolute',
            zIndex: -1,
            h: 'full',
            w: 'full',
            bg: 'white',
            _dark: {
              bg: 'dark',
              shadow: '0 -1px 0 rgba(255,255,255,.1) inset'
            },
            shadow: '0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)',
            _moreContrast: {
              shadow: '0 0 0 1px #000',
              _dark: { shadow: '0 0 0 1px #fff' }
            }
          })
        )}
      />
      <nav
        className={css({
          mx: 'auto',
          display: 'flex',
          h: 'var(--nextra-navbar-height)',
          maxW: '90rem',
          items: 'center',
          justify: 'end',
          gap: 2,
          pl: 'max(env(safe-area-inset-left),1.5rem)',
          pr: 'max(env(safe-area-inset-right),1.5rem)'
        })}
      >
        {config.logoLink ? (
          <Anchor
            href={typeof config.logoLink === 'string' ? config.logoLink : '/'}
            className={css({
              display: 'flex',
              alignItems: 'center',
              _hover: { opacity: 0.75 },
              _ltr: { mr: 'auto' },
              _rtl: { ml: 'auto' }
            })}
          >
            {renderComponent(config.logo)}
          </Anchor>
        ) : (
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              _ltr: { mr: 'auto' },
              _rtl: { ml: 'auto' }
            })}
          >
            {renderComponent(config.logo)}
          </div>
        )}
        {items.map(pageOrMenu => {
          if (pageOrMenu.display === 'hidden') return null

          if (pageOrMenu.type === 'menu') {
            const menu = pageOrMenu as MenuItem

            const isActive =
              menu.route === activeRoute ||
              activeRoute.startsWith(menu.route + '/')

            return (
              <NavbarMenu
                key={menu.title}
                className={cn(
                  classes.link,
                  css({ display: 'flex', gap: 1 }),
                  isActive ? classes.active : classes.inactive
                )}
                menu={menu}
              >
                {menu.title}
                <ArrowRightIcon
                  className={css({
                    h: '18px',
                    minW: '18px',
                    rounded: 'sm',
                    p: 0.5
                  })}
                  pathClassName={css({
                    transformOrigin: 'center',
                    transitionProperty: 'transform',
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
              href={href}
              key={href}
              className={cn(
                classes.link,
                css({
                  position: 'relative',
                  ml: -2,
                  display: 'none',
                  whitespace: 'nowrap',
                  p: 2,
                  md: { display: 'inline-block' }
                }),
                !isActive || page.newWindow ? classes.inactive : classes.active
              )}
              newWindow={page.newWindow}
              aria-current={!page.newWindow && isActive}
            >
              <span
                className={css({
                  position: 'absolute',
                  insetX: 0,
                  textAlign: 'center'
                })}
              >
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
            display: 'none',
            md: { display: 'inline-block' },
            minW: '200px'
          })
        })}

        {config.project.link ? (
          <Anchor
            className={css({ p: 2, color: 'currentColor' })}
            href={config.project.link}
            newWindow
          >
            {renderComponent(config.project.icon)}
          </Anchor>
        ) : null}

        {config.chat.link ? (
          <Anchor
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
          className={cx(
            css({
              mr: -2,
              rounded: 'sm',
              p: 2,
              _active: { bg: 'gray.400/20' },
              md: { display: 'none' },
              // "nextra-hamburger",
              '& svg': {
                '& g': {
                  transformOrigin: 'center',
                  transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
                },
                '& path': {
                  opacity: 1,
                  transition:
                    'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s, opacity 0.2s ease 0.2s'
                },
                '&.open': {
                  '& path': {
                    transition:
                      'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease'
                  },
                  '& g': {
                    transition:
                      'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s'
                  }
                },
                '&.open >': {
                  '& path': {
                    opacity: 0
                  },
                  '& g:nth-of-type(1)': {
                    transform: 'rotate(45deg)',
                    '& path': {
                      transform: 'translate3d(0, 6px, 0)'
                    }
                  },
                  '& g:nth-of-type(2)': {
                    transform: 'rotate(-45deg)',
                    '& path': {
                      transform: 'translate3d(0, -6px, 0)'
                    }
                  }
                }
              }
            })
          )}
          onClick={() => setMenu(!menu)}
        >
          <MenuIcon className={cn({ open: menu })} />
        </button>
      </nav>
    </div>
  )
}
