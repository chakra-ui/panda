'use client'

import { SessionStore } from '@/lib/session-store'
import { cx } from '@/styled-system/css'
import { docsTabs } from '@/styled-system/recipes'
import { Tabs as ArkTabs } from '@ark-ui/react/tabs'
import * as React from 'react'

const tabsStore = new SessionStore('docs-tabs')
const classes = docsTabs()

export const Tabs = (props: React.PropsWithChildren<{ items: string[] }>) => {
  const { items, children } = props
  const storageKey = items.map(item => item).join('|')

  const store = React.useSyncExternalStore(
    tabsStore.subscribe,
    tabsStore.getSnapshot,
    tabsStore.getServerSnapshot
  )

  const persistentStore = React.useMemo(
    () => tabsStore.parseSnapshot(store),
    [store]
  )
  const value = persistentStore?.[storageKey] || items[0]

  return (
    <ArkTabs.Root
      value={value}
      onValueChange={e => tabsStore.setValue(storageKey, e.value)}
      className={cx('docs-scrollbar', classes.root)}
    >
      <ArkTabs.List className={classes.list}>
        {items.map((item, index) => {
          return (
            <ArkTabs.Trigger
              value={item}
              key={index}
              className={classes.trigger}
            >
              {item}
            </ArkTabs.Trigger>
          )
        })}
        <ArkTabs.Indicator className={classes.indicator} />
      </ArkTabs.List>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement<ArkTabs.TriggerProps>(child)) return child
        return React.cloneElement(child, {
          ...child.props,
          value: items[index],
          className: classes.content
        })
      })}
    </ArkTabs.Root>
  )
}

export const Tab = ArkTabs.Content
