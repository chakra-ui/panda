import { css, cx } from "@/styled-system/css"
import { OnFocusedItemContext } from "./threeview-context"
import { ThreeViewSeparator } from "./threeview-separator"
import { useActiveAnchor, useConfig, useMenu } from "@/contexts"
import { Heading } from "nextra"
import { useFSRoute } from "nextra/hooks"
import { Item, PageItem } from "nextra/normalize-pages"
import { FC, useContext } from "react"
import { classes } from "./classes"
import { Anchor } from "@/components/anchor"
import { renderComponent } from "@/utils"

export interface ThreeviewFileProps {
  item: PageItem | Item
  anchors: Heading[]
}

export const ThreeViewFile: FC<ThreeviewFileProps> = ({
  item,
  anchors
}) => {
  const route = useFSRoute()
  const onFocus = useContext(OnFocusedItemContext)

  // It is possible that the item doesn't have any route - for example an external link.
  const active = item.route && [route, route + '/'].includes(item.route + '/')
  const activeAnchor = useActiveAnchor()
  const { setMenu } = useMenu()
  const config = useConfig()

  if (item.type === 'separator') {
    return <ThreeViewSeparator title={item.title} />
  }

  return (
    <li className={cx(css({ display: 'flex', flexDirection: 'column', gap: 1 }), active && 'active')}>
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
            classes.border,
            css({ display: 'flex', flexDirection: 'column', gap: 1, _ltr: { ml: 3 }, _rtl: { mr: 3 } })
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
