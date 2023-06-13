import { FC, useContext } from 'react'
import { panda } from '@/styled-system/jsx'
import { OnFocusedItemContext } from './treeview-context'
import { TreeViewSeparator } from './treeview-separator'
import { useActiveAnchor, useConfig, useMenu } from '@/nextra/contexts'
import { Heading } from 'nextra'
import { useFSRoute } from 'nextra/hooks'
import { Item, PageItem } from 'nextra/normalize-pages'
import { Anchor } from '@/nextra'
import { renderComponent } from '@/nextra/lib'
import { TreeViewList } from './treeview-list'
import { TreeViewLink, threeViewLinkStyle } from './treeview-link'

/* -----------------------------------------------------------------------------
 * TreeView Heading Anchor
 * -----------------------------------------------------------------------------*/

interface ITreeViewHeadingAnchorProps {
  heading: Heading
}

const TreeViewHeadingAnchor: FC<ITreeViewHeadingAnchorProps> = ({
  heading
}) => {
  const { id, value } = heading
  const activeAnchor = useActiveAnchor()
  const { setMenu } = useMenu()

  return (
    <TreeViewLink
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
    </TreeViewLink>
  )
}

/* -----------------------------------------------------------------------------
 * TreeView File
 * -----------------------------------------------------------------------------*/

export interface TreeViewFileProps {
  item: PageItem | Item
  anchors: Heading[]
}

export const TreeViewFile: FC<TreeViewFileProps> = ({ item, anchors }) => {
  const route = useFSRoute()
  const onFocus = useContext(OnFocusedItemContext)

  // It is possible that the item doesn't have any route - for example an external link.
  const active = Boolean(
    item.route && [route, route + '/'].includes(item.route + '/')
  )

  const { setMenu } = useMenu()
  const config = useConfig()

  if (item.type === 'separator') {
    return <TreeViewSeparator title={item.title} />
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
        <TreeViewList>
          {anchors.map(heading => (
            <li key={heading.id}>
              <TreeViewHeadingAnchor heading={heading} />
            </li>
          ))}
        </TreeViewList>
      )}
    </panda.li>
  )
}
