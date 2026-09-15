'use client'

import { css, cx } from '@/styled-system/css'
import { codeTabs } from '@/styled-system/recipes'
import { Tabs } from '@ark-ui/react/tabs'

const classes = codeTabs()

export function TabsList({ titles }: { titles: string[] }) {
  return (
    <Tabs.List
      className={cx(
        classes.list,
        css({ display: 'flex', fontWeight: 'medium' })
      )}
    >
      {titles.map(title => (
        <Tabs.Trigger key={title} value={title} className={classes.trigger}>
          {title}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
  )
}

export function TabContent(props: Tabs.ContentProps) {
  return (
    <Tabs.Content {...props} className={cx(classes.content, props.className)} />
  )
}

export function CodeTabs(props: Tabs.RootProps) {
  return <Tabs.Root {...props} className={cx(classes.root, props.className)} />
}
