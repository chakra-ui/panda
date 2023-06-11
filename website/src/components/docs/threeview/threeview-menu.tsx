import { FC } from 'react'
import type { Heading } from 'nextra'
import type { Item, PageItem } from 'nextra/normalize-pages'
import { ThreeViewFile } from './threeview-file'
import { ThreeViewFolder } from './threeview-folder'
import { ThreeViewList } from './threeview-list'

export interface IThreeViewMenuProps {
  directories: PageItem[] | Item[]
  anchors: Heading[]
  className?: string
  onlyCurrentDocs?: boolean
  root?: boolean
}

export const ThreeViewMenu: FC<IThreeViewMenuProps> = ({
  directories,
  anchors,
  onlyCurrentDocs,
  ...rest
}) => {
  return (
    <ThreeViewList {...rest}>
      {directories.map(item =>
        !onlyCurrentDocs || item.isUnderCurrentDocsTree ? (
          item.type === 'menu' ||
          (item.children && (item.children.length || !item.withIndexPage)) ? (
            <ThreeViewFolder key={item.name} item={item} anchors={anchors} />
          ) : (
            <ThreeViewFile key={item.name} item={item} anchors={anchors} />
          )
        ) : null
      )}
    </ThreeViewList>
  )
}
