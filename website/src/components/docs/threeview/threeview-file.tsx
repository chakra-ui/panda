import { FC, useContext } from 'react'
import { css, cx } from '@/styled-system/css'
import { panda } from '@/styled-system/jsx'
import { OnFocusedItemContext } from './threeview-context'
import { ThreeViewSeparator } from './threeview-separator'
import { useActiveAnchor, useConfig, useMenu } from '@/contexts'
import { Heading } from 'nextra'
import { useFSRoute } from 'nextra/hooks'
import { Item, PageItem } from 'nextra/normalize-pages'
import { classes } from './classes'
import { Anchor } from '@/components/anchor'
import { renderComponent } from '@/utils'
import { ThreeViewList } from '@/components/docs/threeview/threeview-list'

interface IThreeViewHeadingAnchorProps {
  heading: Heading
}

const ThreeViewHeadingAnchor: FC<IThreeViewHeadingAnchorProps> = ({
  heading
}) => {
  const { id, value } = heading
  const activeAnchor = useActiveAnchor()
  const { setMenu } = useMenu()

  return (
    <Anchor
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
    </Anchor>
  )
}

export interface ThreeViewFileProps {
  item: PageItem | Item
  anchors: Heading[]
}

export const ThreeViewFile: FC<ThreeViewFileProps> = ({ item, anchors }) => {
  const route = useFSRoute()
  const onFocus = useContext(OnFocusedItemContext)

  // It is possible that the item doesn't have any route - for example an external link.
  const active = item.route && [route, route + '/'].includes(item.route + '/')

  const { setMenu } = useMenu()
  const config = useConfig()

  if (item.type === 'separator') {
    return <ThreeViewSeparator title={item.title} />
  }

  return (
    <panda.li
      display="flex"
      flexDirection="column"
      gap={1}
      className={active ? 'active' : undefined}
    >
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
        <ThreeViewList
          display="flex"
          flexDirection="column"
          gap={1}
          _ltr={{ ml: 3 }}
          _rtl={{ mr: 3 }}
        >
          {anchors.map(heading => (
            <li key={heading.id}>
              <ThreeViewHeadingAnchor heading={heading} />
            </li>
          ))}
        </ThreeViewList>
      )}
    </panda.li>
  )
}
