import { FC, useState } from 'react'
import { css, cx } from '@/styled-system/css'
import type { Heading } from 'nextra'
import type { Item, PageItem } from 'nextra/normalize-pages'
import { File } from './menu-file'
import { Folder } from './menu-folder'
import { FocusedItemContext, OnFocusedItemContext } from './menu-context'

interface MenuProps {
  directories: PageItem[] | Item[]
  anchors: Heading[]
  base?: string
  className?: string
  onlyCurrentDocs?: boolean
}

export const Menu: FC<MenuProps> = ({
  directories,
  anchors,
  className,
  onlyCurrentDocs,
  ...rest
}) => {
  const [focused, setFocused] = useState<null | string>(null)

  return (
    <FocusedItemContext.Provider value={focused}>
      <OnFocusedItemContext.Provider
        value={item => {
          console.log('item', item)
          setFocused(item)
        }}
      >
        <ul
          className={cx(
            css({ display: 'flex', flexDirection: 'column', gap: 1 }),
            className
          )}
          {...rest}
        >
          {directories.map(item =>
            !onlyCurrentDocs || item.isUnderCurrentDocsTree ? (
              item.type === 'menu' ||
              (item.children &&
                (item.children.length || !item.withIndexPage)) ? (
                <Folder key={item.name} item={item} anchors={anchors} />
              ) : (
                <File key={item.name} item={item} anchors={anchors} />
              )
            ) : null
          )}
        </ul>
      </OnFocusedItemContext.Provider>
    </FocusedItemContext.Provider>
  )
}
