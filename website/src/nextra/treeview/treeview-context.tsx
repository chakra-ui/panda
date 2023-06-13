import { createContext } from "react"

export const FocusedItemContext = createContext<null | string>(null)

export const OnFocusedItemContext = createContext<
  null | ((item: string | null) => any)
>(null)

export const FolderLevelContext = createContext(0)
