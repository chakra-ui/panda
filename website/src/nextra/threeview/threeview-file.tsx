import { FC, useContext } from 'react'
import { panda } from '@/styled-system/jsx'
import { OnFocusedItemContext } from './threeview-context'
import { ThreeViewSeparator } from './threeview-separator'
import { useActiveAnchor, useConfig, useMenu } from '@/nextra/contexts'
import { Heading } from 'nextra'
import { useFSRoute } from 'nextra/hooks'
import { Item, PageItem } from 'nextra/normalize-pages'
import { Anchor } from '@/nextra'
import { renderComponent } from '@/nextra/lib'
import { ThreeViewList } from './threeview-list'
import { ThreeViewLink, threeViewLinkStyle } from './threeview-link'

/* -----------------------------------------------------------------------------
 * ThreeView Heading Anchor
 * -----------------------------------------------------------------------------*/

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
    <ThreeViewLink
      href={`#${id}`}
      active={activeAnchor[id]?.isActive}
      display="flex"
      gap={2}
      _before={{
        opacity: 0.25,
        content: '"#"'
      }}
      onClick={() => {
        setMenu(false)
      }}
    >
      {value}
    </ThreeViewLink>
  )
}

/* -----------------------------------------------------------------------------
 * ThreeView File
 * -----------------------------------------------------------------------------*/

export interface ThreeViewFileProps {
  item: PageItem | Item
  anchors: Heading[]
}

export const ThreeViewFile: FC<ThreeViewFileProps> = ({ item, anchors }) => {
  const route = useFSRoute()
  const onFocus = useContext(OnFocusedItemContext)

  // It is possible that the item doesn't have any route - for example an external link.
  const active = Boolean(
    item.route && [route, route + '/'].includes(item.route + '/')
  )

  const { setMenu } = useMenu()
  const config = useConfig()

  if (item.type === 'separator') {
    return <ThreeViewSeparator title={item.title} />
  }

  return (
    <panda.li display="flex" flexDirection="column" gap={1}>
      <Anchor
        href={(item as PageItem).href || item.route}
        newWindow={(item as PageItem).newWindow}
        className={threeViewLinkStyle({ active })}
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
        <ThreeViewList>
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
