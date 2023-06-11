import { cx } from '@/styled-system/css'
import { tabs as tabsRecipe } from '@/styled-system/recipes'
import {
  Tabs as ArkTabs,
  TabContent,
  TabIndicator,
  TabList,
  TabTrigger
} from '@ark-ui/react'
import { Children, cloneElement } from 'react'

export function Tabs({
  items,
  children
}: {
  items: string[]
  children: React.ReactElement[]
}) {
  const tabs = Children.map(children, (child, index) =>
    cloneElement(child as any, {
      ...child.props,
      key: index,
      value: items[index]
    })
  )

  return (
    <ArkTabs
      defaultValue={items[0]}
      className={cx('nextra-scrollbar', tabsRecipe())}
    >
      <TabList>
        {items.map((item, index) => {
          return (
            <TabTrigger value={item} key={index}>
              {item}
            </TabTrigger>
          )
        })}
        <TabIndicator />
      </TabList>
      {tabs}
    </ArkTabs>
  )
}

export function Tab({ children, ...props }: React.ComponentProps<'div'>) {
  return (
    // @ts-ignore
    <TabContent {...props}>{children}</TabContent>
  )
}
