import { useRouter } from 'next/router'
import type { Heading } from 'nextra'
import type { ReactElement } from 'react'
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

import { useFSRoute } from 'nextra/hooks'
import { ArrowRightIcon, ExpandIcon } from 'nextra/icons'
import type { Item, MenuItem, PageItem } from 'nextra/normalize-pages'
import { css, cx } from '../../styled-system/css'
import { useActiveAnchor, useConfig, useMenu } from '../contexts'
import { renderComponent } from '../utils'
import { Anchor } from './anchor'
import { Collapse } from './collapse'
import { LocaleSwitch } from './locale-switch'

const TreeState: Record<string, boolean> = Object.create(null)

const FocusedItemContext = createContext<null | string>(null)
const OnFocusedItemContext = createContext<
  null | ((item: string | null) => any)
>(null)
const FolderLevelContext = createContext(0)

const Folder = memo(function FolderInner(props: FolderProps) {
  const level = useContext(FolderLevelContext)
  return (
    <FolderLevelContext.Provider value={level + 1}>
      <FolderImpl {...props} />
    </FolderLevelContext.Provider>
  )
})

const classes = {
  link: css({
    display: 'flex',
    rounded: 'md',
    px: 2,
    py: 1.5,
    textStyle: 'sm',
    transitionProperty: 'colors',
    wordBreak: 'break-word',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    _moreContrast: { border: '1px solid' }
  }),
  inactive: css({
    color: 'gray.500',
    _hover: { bg: 'gray.100', color: 'gray.900' },
    _dark: {
      color: 'neutral.500',
      _hover: {
        // bg: 'primary.100/5',
        bg: 'rgb(219 234 254 / 0.05)',
        color: 'gray.50'
      }
    },
    _moreContrast: {
      color: 'gray.900',
      _dark: {
        color: 'gray.50',
        _hover: {
          borderColor: 'gray.50'
        }
      },
      borderColor: 'transparent',
      _hover: {
        borderColor: 'gray.900'
      }
    }
  }),
  active: css({
    bg: 'primary.100',
    fontWeight: 'semibold',
    color: 'primary.800',
    // _dark: { bg: 'primary.400/10', color: 'primary.600' },
    _dark: { bgColor: 'rgb(96 165 250 / 0.1)', color: 'primary.600' },
    _moreContrast: {
      borderColor: 'primary.500',
      _dark: {
        borderColor: 'primary.500'
      }
    }
  }),
  list: css({ display: 'flex', flexDirection: 'column', gap: 1 }),
  border: css({
    position: 'relative',
    _before: {
      position: 'absolute',
      insetY: 1,
      width: '1px',
      bg: 'gray.200',
      content: "''",
      _dark: { bg: 'neutral.800' }
    },
    _ltr: { pl: 3, _before: { left: 0 } },
    _rtl: { pr: 3, _before: { right: 0 } }
  })
}

type FolderProps = {
  item: PageItem | MenuItem | Item
  anchors: Heading[]
}

function FolderImpl({ item, anchors }: FolderProps): ReactElement {
  const routeOriginal = useFSRoute()
  const [route] = routeOriginal.split('#')
  const active = [route, route + '/'].includes(item.route + '/')
  const activeRouteInside = active || route.startsWith(item.route + '/')

  const focusedRoute = useContext(FocusedItemContext)
  const focusedRouteInside = !!focusedRoute?.startsWith(item.route + '/')
  const level = useContext(FolderLevelContext)

  const { setMenu } = useMenu()
  const config = useConfig()
  const { theme } = item as Item
  const open =
    TreeState[item.route] === undefined
      ? active ||
        activeRouteInside ||
        focusedRouteInside ||
        (theme && 'collapsed' in theme
          ? !theme.collapsed
          : level < config.sidebar.defaultMenuCollapseLevel)
      : TreeState[item.route] || focusedRouteInside

  const rerender = useState({})[1]

  useEffect(() => {
    if (activeRouteInside || focusedRouteInside) {
      TreeState[item.route] = true
    }
  }, [activeRouteInside, focusedRouteInside, item.route])

  if (item.type === 'menu') {
    const menu = item as MenuItem
    const routes = Object.fromEntries(
      (menu.children || []).map(route => [route.name, route])
    )
    // @ts-ignore
    item.children = Object.entries(menu.items || {}).map(([key, item]) => {
      const route = routes[key] || {
        name: key,
        ...('locale' in menu && { locale: menu.locale }),
        route: menu.route + '/' + key
      }
      return {
        ...route,
        ...item
      }
    })
  }

  const isLink = 'withIndexPage' in item && item.withIndexPage
  // use button when link don't have href because it impacts on SEO
  const ComponentToUse = isLink ? Anchor : 'button'

  return (
    <li className={cx(open && 'open', active && 'active')}>
      <ComponentToUse
        href={isLink ? item.route : undefined}
        className={cx(
          css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }),
          !isLink && css({ textAlign: 'left', width: '100%' }),
          classes.link,
          active ? classes.active : classes.inactive
        )}
        onClick={e => {
          const clickedToggleIcon = ['svg', 'path'].includes(
            (e.target as HTMLElement).tagName.toLowerCase()
          )
          if (clickedToggleIcon) {
            e.preventDefault()
          }
          if (isLink) {
            // If it's focused, we toggle it. Otherwise, always open it.
            if (active || clickedToggleIcon) {
              TreeState[item.route] = !open
            } else {
              TreeState[item.route] = true
              setMenu(false)
            }
            rerender({})
            return
          }
          if (active) return
          TreeState[item.route] = !open
          rerender({})
        }}
      >
        {renderComponent(config.sidebar.titleComponent, {
          title: item.title,
          type: item.type,
          route: item.route
        })}
        <ArrowRightIcon
          className={css({
            height: '18px',
            minWidth: '18px',
            borderRadius: 'sm',
            p: '0.5',
            _hover: {
              // bg: 'gray.800/5',
              bg: 'rgb(31 41 55 / 0.5)',
              // _dark: { bg: 'gray.100/5' }
              _dark: { bg: 'rgb(243 244 246 / 0.05)' }
            }
          })}
          pathClassName={cx(
            css({
              transformOrigin: 'center',
              transitionProperty: 'transform',
              _rtl: { transform: 'rotate(-180deg)' }
            }),
            open &&
              css({
                _ltr: { transform: 'rotate(90deg)' },
                _rtl: { transform: 'rotate(-270deg)' }
              })
          )}
        />
      </ComponentToUse>

      <Collapse className={css({ ps: '0', pt: '1' })} isOpen={open}>
        {Array.isArray(item.children) ? (
          <Menu
            className={cx(classes.border, css({ ms: '3' }))}
            directories={item.children}
            base={item.route}
            anchors={anchors}
          />
        ) : null}
      </Collapse>
    </li>
  )
}

function Separator({ title }: { title: string }): ReactElement {
  const config = useConfig()
  return (
    <li
      className={cx(
        css({ wordBreak: 'break-word' }),
        title
          ? css({
              mt: 5,
              mb: 2,
              px: 2,
              py: 1.5,
              textStyle: 'sm',
              fontWeight: 'semibold',
              color: 'gray.900',
              _first: { mt: 0 },
              _dark: { color: 'gray.100' }
            })
          : css({ my: 4 })
      )}
    >
      {title ? (
        renderComponent(config.sidebar.titleComponent, {
          title,
          type: 'separator',
          route: ''
        })
      ) : (
        <hr
          className={css({
            mx: 2,
            borderTopWidth: '1px',
            borderTopColor: 'gray.200',
            // _dark: { borderTopColor: 'primary.100/10' }
            _dark: { borderTopColor: 'rgb(219 234 254 / 0.1)' } // TODO opacity modifier
          })}
        />
      )}
    </li>
  )
}

function File({
  item,
  anchors
}: {
  item: PageItem | Item
  anchors: Heading[]
}): ReactElement {
  const route = useFSRoute()
  const onFocus = useContext(OnFocusedItemContext)

  // It is possible that the item doesn't have any route - for example an external link.
  const active = item.route && [route, route + '/'].includes(item.route + '/')
  const activeAnchor = useActiveAnchor()
  const { setMenu } = useMenu()
  const config = useConfig()

  if (item.type === 'separator') {
    return <Separator title={item.title} />
  }

  return (
    <li className={cx(classes.list, active && 'active')}>
      <Anchor
        href={(item as PageItem).href || item.route}
        newWindow={(item as PageItem).newWindow}
        className={cx(classes.link, active ? classes.active : classes.inactive)}
        onClick={() => {
          setMenu(false)
        }}
        onFocus={() => {
          onFocus?.(item.route)
        }}
        onBlur={() => {
          onFocus?.(null)
        }}
      >
        {renderComponent(config.sidebar.titleComponent, {
          title: item.title,
          type: item.type,
          route: item.route
        })}
      </Anchor>
      {active && anchors.length > 0 && (
        <ul
          className={cx(
            classes.list,
            classes.border,
            css({ _ltr: { ml: 3 }, _rtl: { mr: 3 } })
          )}
        >
          {anchors.map(({ id, value }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cx(
                  classes.link,
                  css({
                    display: 'flex',
                    gap: 2,
                    _before: { opacity: 0.25, content: '"#"' }
                  }),
                  activeAnchor[id]?.isActive ? classes.active : classes.inactive
                )}
                onClick={() => {
                  setMenu(false)
                }}
              >
                {value}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

interface MenuProps {
  directories: PageItem[] | Item[]
  anchors: Heading[]
  base?: string
  className?: string
  onlyCurrentDocs?: boolean
}

function Menu({
  directories,
  anchors,
  className,
  onlyCurrentDocs
}: MenuProps): ReactElement {
  return (
    <ul className={cx(classes.list, className)}>
      {directories.map(item =>
        !onlyCurrentDocs || item.isUnderCurrentDocsTree ? (
          item.type === 'menu' ||
          (item.children && (item.children.length || !item.withIndexPage)) ? (
            <Folder key={item.name} item={item} anchors={anchors} />
          ) : (
            <File key={item.name} item={item} anchors={anchors} />
          )
        ) : null
      )}
    </ul>
  )
}

interface SideBarProps {
  docsDirectories: PageItem[]
  flatDirectories: Item[]
  fullDirectories: Item[]
  asPopover?: boolean
  headings: Heading[]
  includePlaceholder: boolean
}

const hiddenClass = css({
  overflow: 'hidden',
  md: { overflow: 'auto' }
})

export function Sidebar({
  docsDirectories,
  flatDirectories,
  fullDirectories,
  asPopover = false,
  headings,
  includePlaceholder
}: SideBarProps): ReactElement {
  const config = useConfig()
  const { menu, setMenu } = useMenu()
  const router = useRouter()
  const [focused, setFocused] = useState<null | string>(null)
  const [showSidebar, setSidebar] = useState(true)
  const [showToggleAnimation, setToggleAnimation] = useState(false)

  const anchors = useMemo(() => headings.filter(v => v.depth === 2), [headings])
  const sidebarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menu) {
      document.body.classList.add(...hiddenClass.split(' '))
    } else {
      document.body.classList.remove(...hiddenClass.split(' '))
    }
    return () => {
      document.body.classList.remove(...hiddenClass.split(' '))
    }
  }, [menu])

  useEffect(() => {
    const activeElement = sidebarRef.current?.querySelector('li.active')

    if (activeElement && (window.innerWidth > 767 || menu)) {
      const scroll = () => {
        scrollIntoView(activeElement, {
          block: 'center',
          inline: 'center',
          scrollMode: 'always',
          boundary: containerRef.current
        })
      }
      if (menu) {
        // needs for mobile since menu has transition transform
        setTimeout(scroll, 300)
      } else {
        scroll()
      }
    }
  }, [menu])

  // Always close mobile nav when route was changed (e.g. logo click)
  useEffect(() => {
    setMenu(false)
  }, [router.asPath, setMenu])

  const hasI18n = config.i18n.length > 0
  const hasMenu = config.darkMode || hasI18n

  return (
    <>
      {includePlaceholder && asPopover ? (
        <div
          className={css({
            xl: { display: 'none' },
            h: 0,
            w: 64,
            flexShrink: 0
          })}
        />
      ) : null}
      <div
        className={cx(
          css({
            _motionReduce: { transitionProperty: 'none' },
            transition: 'background-color 1.5s ease'
          }),
          menu
            ? css({
                position: 'fixed',
                inset: 0,
                zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.8)', // opacity modifier
                _dark: { backgroundColor: 'rgba(0,0,0,0.6)' }
              })
            : css({ backgroundColor: 'transparent' })
        )}
        onClick={() => setMenu(false)}
      />
      <aside
        className={cx(
          'nextra-sidebar-container',
          css({
            display: 'flex',
            flexDirection: 'column',
            mdDown: {
              _motionReduce: { transitionProperty: 'none' },
              position: 'fixed',
              pt: 'var(--nextra-navbar-height)',
              top: 0,
              bottom: 0,
              w: '100%',
              zIndex: 15,
              overscrollBehavior: 'contain',
              backgroundColor: 'white',
              _dark: { backgroundColor: 'dark' },
              transition: 'transform 0.8s cubic-bezier(0.52, 0.16, 0.04, 1)',
              willChange: 'transform, opacity',
              contain: 'layout style',
              backfaceVisibility: 'hidden',
              '& > .nextra-scrollbar': {
                maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
              }
            },
            md: {
              top: 16,
              flexShrink: 0,
              '& > div': {
                maskImage: `linear-gradient(to bottom, transparent, #000 20px), linear-gradient(to left, #000 10px, transparent 10px)`
              }
            },
            _motionReduce: {
              transform: 'none'
            },
            transform: 'translate3d(0,0,0)',
            transitionProperty: 'all',
            transition: 'ease-in-out',
            _print: { display: 'none' },
            "& [data-toggle-animation='show'] button": {
              opacity: 0,
              animation: 'fadein 1s ease 0.2s forwards'
            },
            "& [data-toggle-animation='hide'] button": {
              opacity: 0,
              animation: 'fadein2 1s ease 0.2s forwards'
            }
          }),
          showSidebar ? css({ md: { w: 64 } }) : css({ md: { w: 20 } }),
          asPopover
            ? css({ md: { display: 'none' } })
            : css({
                position: 'sticky',
                alignSelf: { base: 'stretch', md: 'flex-start' }
              }),
          menu
            ? css({ mdDown: { transform: 'translate3d(0,0,0)' } })
            : css({ mdDown: { transform: 'translate3d(-100%,0,0)' } })
        )}
        ref={containerRef}
      >
        <div className={css({ px: 4, pt: 4, md: { display: 'none' } })}>
          {renderComponent(config.search.component, {
            directories: flatDirectories
          })}
        </div>
        <FocusedItemContext.Provider value={focused}>
          <OnFocusedItemContext.Provider
            value={item => {
              setFocused(item)
            }}
          >
            <div
              className={cx(
                css({
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  px: '4',
                  py: '10',
                  md: {
                    h: 'calc(100vh - var(--nextra-navbar-height) - var(--nextra-menu-height))'
                  }
                }),
                showSidebar ? 'nextra-scrollbar' : 'no-scrollbar'
              )}
              ref={sidebarRef}
            >
              {/* without asPopover check <Collapse />'s inner.clientWidth on `layout: "raw"` will be 0 and element will not have width on initial loading */}
              {(!asPopover || !showSidebar) && (
                <Collapse isOpen={showSidebar} horizontal>
                  <Menu
                    className={css({ mdDown: { display: 'none' } })}
                    // The sidebar menu, shows only the docs directories.
                    directories={docsDirectories}
                    // When the viewport size is larger than `md`, hide the anchors in
                    // the sidebar when `floatTOC` is enabled.
                    anchors={config.toc.float ? [] : anchors}
                    onlyCurrentDocs
                  />
                </Collapse>
              )}
              <Menu
                className={css({ md: { display: 'none' } })}
                // The mobile dropdown menu, shows all the directories.
                directories={fullDirectories}
                // Always show the anchor links on mobile (`md`).
                anchors={anchors}
              />
            </div>
          </OnFocusedItemContext.Provider>
        </FocusedItemContext.Provider>

        {hasMenu && (
          <div
            className={cx(
              css({
                position: 'sticky',
                bottom: 0,
                bg: 'white',
                _dark: {
                  // when banner is showed, sidebar links can be behind menu, set bg color as body bg color
                  bg: 'dark',
                  borderColor: 'neutral.800',
                  shadow: '0 -12px 16px #111'
                },
                mx: 4,
                py: 4,
                shadow: '0 -12px 16px #fff',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                _moreContrast: {
                  bg: 'neutral.400',
                  shadow: 'none',
                  _dark: {
                    shadow: 'none'
                  }
                }
              }),
              showSidebar
                ? cx(
                    hasI18n && css({ justifyContent: 'flex-end' }),
                    css({ borderTopWidth: '1px' })
                  )
                : css({ py: 4, flexWrap: 'wrap', justifyContent: 'center' })
            )}
            data-toggle-animation={
              showToggleAnimation ? (showSidebar ? 'show' : 'hide') : 'off'
            }
          >
            {hasI18n && (
              <LocaleSwitch
                options={config.i18n}
                lite={!showSidebar}
                className={cx(
                  showSidebar ? css({ flex: 1 }) : css({ mdDown: { flex: 1 } })
                )}
              />
            )}
            {config.darkMode && (
              <div
                className={
                  showSidebar && !hasI18n
                    ? css({ flex: 1, display: 'flex', flexDirection: 'column' })
                    : ''
                }
              >
                {renderComponent(config.themeSwitch.component, {
                  lite: !showSidebar || hasI18n
                })}
              </div>
            )}
            {config.sidebar.toggleButton && (
              <button
                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
                className={css({
                  mdDown: { display: 'none' },
                  h: 7,
                  transitionProperty: 'colors',
                  color: 'gray.600',
                  _dark: { color: 'gray.400' },
                  px: 2,
                  _hover: {
                    color: 'gray.900',
                    bg: 'gray.100',
                    _dark: {
                      color: 'gray.50',
                      bg: 'rgb(219 234 254 / 0.05)'
                    }
                  }
                })}
                onClick={() => {
                  setSidebar(!showSidebar)
                  setToggleAnimation(true)
                }}
              >
                <ExpandIcon isOpen={showSidebar} />
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
