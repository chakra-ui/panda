import { FC } from 'react'
import type { Heading } from '@/types/nextra'
import type { Item, PageItem } from '@/types/nextra'
import { TreeViewFile } from './treeview-file'
import { TreeViewFolder } from './treeview-folder'
import { TreeViewList } from './treeview-list'

export interface ITreeViewMenuProps {
  directories: PageItem[] | Item[]
  anchors: Heading[]
  className?: string
  onlyCurrentDocs?: boolean
  root?: boolean
}

export const TreeViewMenu: FC<ITreeViewMenuProps> = ({
  directories,
  anchors,
  onlyCurrentDocs,
  ...rest
}) => {
  return (
    <TreeViewList {...rest}>
      {directories.map(item =>
        !onlyCurrentDocs || item.isUnderCurrentDocsTree ? (
          item.type === 'menu' ||
          (item.children && (item.children.length || !item.withIndexPage)) ? (
            <TreeViewFolder key={item.name} item={item} anchors={anchors} />
          ) : (
            <TreeViewFile key={item.name} item={item} anchors={anchors} />
          )
        ) : null
      )}
    </TreeViewList>
  )
}
