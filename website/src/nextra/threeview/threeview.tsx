import { FC, useState } from 'react'
import { FocusedItemContext, OnFocusedItemContext } from './threeview-context'
import { ThreeViewMenu, type IThreeViewMenuProps } from './threeview-menu'

export type ThreeViewProps = Omit<IThreeViewMenuProps, 'root'>;

export const ThreeView: FC<ThreeViewProps> = (props) => {
  const [focused, setFocused] = useState<null | string>(null)

  return (
    <FocusedItemContext.Provider value={focused}>
      <OnFocusedItemContext.Provider
        value={item => {
          setFocused(item)
        }}
      >
        <ThreeViewMenu root {...props} />
      </OnFocusedItemContext.Provider>
    </FocusedItemContext.Provider>
  )
}
