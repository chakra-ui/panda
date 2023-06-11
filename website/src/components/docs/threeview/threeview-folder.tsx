import { Anchor } from '@/components/anchor'
import { Collapse } from '@/components/collapse'
import { classes } from './classes'
import { ThreeViewMenu } from './threeview-menu'
import { FocusedItemContext, FolderLevelContext } from './threeview-context'
import { useConfig, useMenu } from '@/contexts'
import { ArrowRightIcon } from '@/icons'
import { css, cx } from '@/styled-system/css'
import { renderComponent } from '@/utils'
import { Heading } from 'nextra'
import { useFSRoute } from 'nextra/hooks'
import { Item, MenuItem, PageItem } from 'nextra/normalize-pages'
import { FC, memo, useContext, useEffect, useState } from 'react'

const TreeState: Record<string, boolean> = Object.create(null)

type FolderProps = {
  item: PageItem | MenuItem | Item
  anchors: Heading[]
}

const FolderImpl: FC<FolderProps> = ({ item, anchors }) => {
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
      {/* TODO: replace with shared Button */}
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
          <ThreeViewMenu
            className={css({ ms: '3' })}
            directories={item.children}
            anchors={anchors}
          />
        ) : null}
      </Collapse>
    </li>
  )
}

export const ThreeViewFolder = memo((props: FolderProps) => {
  const level = useContext(FolderLevelContext)

  return (
    <FolderLevelContext.Provider value={level + 1}>
      <FolderImpl {...props} />
    </FolderLevelContext.Provider>
  )
})

if (process.env.NODE_ENV === 'development') {
  ThreeViewFolder.displayName = 'ThreeViewFolder'
}
