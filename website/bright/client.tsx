'use client'

import { TabContent, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import React from 'react'
import { css } from '../styled-system/css'

export function TabsList({ titles, children }) {
  const tabs = React.Children.toArray(children)
  return (
    <TabList className={css({ display: 'flex' })}>
      {titles.map((title, i) => (
        <TabTrigger asChild key={title} value={title}>
          {tabs[i]}
        </TabTrigger>
      ))}
    </TabList>
  )
}

export { Tabs as TabsRoot, TabContent as TabsContent }
