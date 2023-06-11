import { FC, useState } from 'react'
import { FocusedItemContext, OnFocusedItemContext } from './threeview-context'
import { ThreeViewMenu, type IThreeViewMenuProps } from './threeview-menu'

export const ThreeView: FC<IThreeViewMenuProps> = (props) => {
  const [focused, setFocused] = useState<null | string>(null)

  return (
    <FocusedItemContext.Provider value={focused}>
      <OnFocusedItemContext.Provider
        value={item => {
          setFocused(item)
        }}
      >
        <ThreeViewMenu {...props} />
      </OnFocusedItemContext.Provider>
    </FocusedItemContext.Provider>
  )
}
