'use client'

import { TabContent, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import React from 'react'
import { css } from '../styled-system/css'

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
