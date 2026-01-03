'use client'

import { SessionStore } from '@/lib/session-store'
import { cx } from '@/styled-system/css'
import { nextraTabs } from '@/styled-system/recipes'
import { Tabs as ArkTabs } from '@ark-ui/react/tabs'
import * as React from 'react'

const tabsStore = new SessionStore('docs-tabs')

export const Tabs = (props: React.PropsWithChildren<{ items: string[] }>) => {
  const { items, children } = props
  const storageKey = items.map(item => item).join('|')

  const store = React.useSyncExternalStore(
    tabsStore.subscribe,
    tabsStore.getSnapshot,
    tabsStore.getServerSnapshot
  )

  const persistentStore = React.useMemo(
    () => tabsStore.getParsedSnapshot(),
    [store]
  )
  const value = persistentStore?.[storageKey] || items[0]

  return (
    <ArkTabs.Root
      value={value}
      onValueChange={e => tabsStore.setValue(storageKey, e.value)}
      className={cx('docs-scrollbar', nextraTabs())}
    >
      <ArkTabs.List>
        {items.map((item, index) => {
          return (
            <ArkTabs.Trigger value={item} key={index}>
              {item}
            </ArkTabs.Trigger>
          )
        })}
        <ArkTabs.Indicator />
      </ArkTabs.List>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement<ArkTabs.TriggerProps>(child)) return child
        return React.cloneElement(child, {
          ...child.props,
          value: items[index]
        })
      })}
    </ArkTabs.Root>
  )
}

export const Tab = ArkTabs.Content
