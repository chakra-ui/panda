import type { Dispatch, SetStateAction } from 'react';
import { useContext, createContext } from 'react'

interface Menu {
  menu: boolean
  setMenu: Dispatch<SetStateAction<boolean>>
}

const MenuContext = createContext<Menu>({
  menu: false,
  setMenu: () => false,
})

export const useMenu = () => useContext(MenuContext)

export const MenuProvider = MenuContext.Provider
