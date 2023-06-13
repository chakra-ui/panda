import { Anchor, Collapse } from '@/nextra'
import { TreeViewMenu } from './treeview-menu'
import { FocusedItemContext, FolderLevelContext } from './treeview-context'
import { threeViewLinkStyle } from './treeview-link'
import { useConfig, useMenu } from '@/nextra/contexts'
import { ArrowRightIcon } from '@/icons'
import { css, cx } from '@/styled-system/css'
import { renderComponent } from '@/nextra/lib'
import { Heading } from 'nextra'
import { useFSRoute } from 'nextra/hooks'
import { Item, MenuItem, PageItem } from 'nextra/normalize-pages'
import { FC, memo, useContext, useEffect, useState } from 'react'

const TreeState: Record<string, boolean> = Object.create(null)

/* -----------------------------------------------------------------------------
 * TreeView Folder Implementation
 * -----------------------------------------------------------------------------*/

const arrowRightIconStyles = css({
  height: '18px',
  minWidth: '18px',
  borderRadius: 'sm',
  p: '0.5',
  _hover: {
    bg: 'blackAlpha.200',
    _dark: {
      bg: 'whiteAlpha.200'
    }
  },
  '& path': {
    transformOrigin: 'center',
    transitionProperty: 'transform',
    _rtl: {
      transform: 'rotate(-180deg)'
    }
  },
  '&[data-open="true"] path': {
    _ltr: {
      transform: 'rotate(90deg)'
    },
    _rtl: {
      transform: 'rotate(-270deg)'
    }
  }
})

type TreeViewFolderImplProps = {
  item: PageItem | MenuItem | Item
  anchors: Heading[]
}

const TreeViewFolderImpl: FC<TreeViewFolderImplProps> = ({ item, anchors }) => {
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
    <li>
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
          threeViewLinkStyle({ active })
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
        <ArrowRightIcon data-open={open} className={arrowRightIconStyles} />
      </ComponentToUse>

      <Collapse className={css({ ps: '0', pt: '1' })} isOpen={open}>
        {Array.isArray(item.children) ? (
          <TreeViewMenu directories={item.children} anchors={anchors} />
        ) : null}
      </Collapse>
    </li>
  )
}

/* -----------------------------------------------------------------------------
 * TreeView Folder
 * -----------------------------------------------------------------------------*/

export const TreeViewFolder = memo((props: TreeViewFolderImplProps) => {
  const level = useContext(FolderLevelContext)

  return (
    <FolderLevelContext.Provider value={level + 1}>
      <TreeViewFolderImpl {...props} />
    </FolderLevelContext.Provider>
  )
})

if (process.env.NODE_ENV === 'development') {
  TreeViewFolder.displayName = 'TreeViewFolder'
}
