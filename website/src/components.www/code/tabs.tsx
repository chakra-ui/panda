'use client'

import { css } from '@/styled-system/css'
import { TabContent, TabList, Tabs, TabTrigger } from '@ark-ui/react'

export function TabsList({ titles }: { titles: string[] }) {
  return (
    <TabList className={css({ display: 'flex', fontWeight: 'medium' })}>
      {titles.map(title => (
        <TabTrigger key={title} value={title}>
          {title}
        </TabTrigger>
      ))}
    </TabList>
  )
}

export { Tabs as CodeTabs, TabContent as TabsContent }
