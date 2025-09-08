import { Anchor } from '@/components/ui/anchor'
import { useActiveAnchor, useMenu } from '@/mdx/contexts'
import { panda } from '@/styled-system/jsx'
import { usePathname } from 'next/navigation'
import { FC, useContext } from 'react'
import { OnFocusedItemContext } from './treeview-context'
import { TreeViewLink, treeviewRecipe } from './treeview-link'
import { TreeViewList } from './treeview-list'
import { TreeViewSeparator } from './treeview-separator'

const TreeViewHeadingAnchor: FC<{ heading: { id: string; value: string } }> = ({
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
  item: any
  anchors: any[]
}

export const TreeViewFile: FC<TreeViewFileProps> = ({ item, anchors }) => {
  const pathname = usePathname()
  const onFocus = useContext(OnFocusedItemContext)

  // It is possible that the item doesn't have any route - for example an external link.
  const active = Boolean(
    item.route && [pathname, pathname + '/'].includes(item.route + '/')
  )

  const { setMenu } = useMenu()

  if (item.type === 'separator') {
    return <TreeViewSeparator title={item.title} />
  }

  return (
    <panda.li
      display="flex"
      flexDirection="column"
      gap={1}
      className={active ? 'active' : undefined}
    >
      <Anchor
        href={(item as any).href || item.route}
        newWindow={(item as any).newWindow}
        className={treeviewRecipe({ active })}
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
        {/* {renderComponent(config.sidebar.titleComponent, {
          title: item.title,
          type: item.type,
          route: item.route
        })} */}
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
