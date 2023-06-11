import { FC } from 'react'
import { panda } from '@/styled-system/jsx'
import type { Heading } from 'nextra'
import type { Item, PageItem } from 'nextra/normalize-pages'
import { ThreeViewFile } from './threeview-file'
import { ThreeViewFolder } from './threeview-folder'

export interface IThreeViewMenuProps {
  directories: PageItem[] | Item[]
  anchors: Heading[]
  className?: string
  onlyCurrentDocs?: boolean
}

export const ThreeViewMenu: FC<IThreeViewMenuProps> = ({
  directories,
  anchors,
  onlyCurrentDocs,
  ...rest
}) => {
  return (
    <panda.ul display="flex" flexDirection="column" gap={1} {...rest}>
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
    </panda.ul>
  )
}
