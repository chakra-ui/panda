import { Children, ComponentProps, ReactElement, cloneElement } from 'react'
import {
  TabContent,
  TabIndicator,
  TabList,
  Tabs as ArkTabs,
  TabTrigger
} from '@ark-ui/react'
import { cx } from '../../styled-system/css'
import { tabs as tabsRecipe } from '../../styled-system/recipes'

export function Tabs({
  items,
  children
}: {
  items: string[]
  children: ReactElement
}): ReactElement {
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
              <button>{item}</button>
            </TabTrigger>
          )
        })}
        <TabIndicator />
      </TabList>
      {tabs}
    </ArkTabs>
  )
}

export function Tab({
  children,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    // @ts-ignore
    <TabContent {...props}>{children}</TabContent>
  )
}
