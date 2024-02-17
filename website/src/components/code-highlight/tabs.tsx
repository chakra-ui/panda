'use client'

import { css } from '@/styled-system/css'
import { Tabs } from '@ark-ui/react'

export function TabsList({ titles }: { titles: string[] }) {
  return (
    <Tabs.List className={css({ display: 'flex', fontWeight: 'medium' })}>
      {titles.map(title => (
        <Tabs.Trigger key={title} value={title}>
          {title}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  )
}

export const TabContent = Tabs.Content
export const CodeTabs = Tabs.Root
