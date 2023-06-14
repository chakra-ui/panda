import { FC, useState } from 'react'
import { FocusedItemContext, OnFocusedItemContext } from './treeview-context'
import { TreeViewMenu, type ITreeViewMenuProps } from './treeview-menu'

export type TreeViewProps = Omit<ITreeViewMenuProps, 'root'>;

export const TreeView: FC<TreeViewProps> = (props) => {
  const [focused, setFocused] = useState<null | string>(null)

  return (
    <FocusedItemContext.Provider value={focused}>
      <OnFocusedItemContext.Provider
        value={item => {
          setFocused(item)
        }}
      >
        <TreeViewMenu root {...props} />
      </OnFocusedItemContext.Provider>
    </FocusedItemContext.Provider>
  )
}
