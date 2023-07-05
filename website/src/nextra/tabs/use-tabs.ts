import { useMemo, useSyncExternalStore } from 'react'
import {
  getServerSnapshot,
  getSnapshot,
  parseStorage,
  setStorage,
  subscribe
} from './tabs-store'

export interface IUseTabsProps {
  items: string[]
}

export const useTabs = ({ items }: IUseTabsProps) => {
  const tabsUniqueId = items.map(item => item).join('|')

  const rawTabsStore = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const tabStore = useMemo(() => parseStorage(rawTabsStore), [rawTabsStore])
  const selectedTab = tabStore?.[tabsUniqueId] || items[0]

  return {
    value: selectedTab,
    onChange: event => setStorage(tabsUniqueId, event.value)
  }
}
