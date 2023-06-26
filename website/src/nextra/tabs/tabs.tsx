import { cx } from '@/styled-system/css'
import { nextraTabsRecipe, NextraTabsVariantProps } from '@/styled-system/recipes'
import {
  Tabs as ArkTabs,
  TabContent,
  TabIndicator,
  TabList,
  TabTrigger
} from '@ark-ui/react'
import { Children, cloneElement } from 'react'
import { IUseTabsProps, useTabs } from './use-tabs'

export interface ITabProps extends NextraTabsVariantProps, IUseTabsProps {
  children: React.ReactElement[]
}

export function Tabs(props: ITabProps) {
  const { items, children } = props
  const { value, onChange } = useTabs(props)

  return (
    <ArkTabs
      value={value}
      onChange={onChange}
      className={cx('nextra-scrollbar', nextraTabsRecipe())}
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
      {Children.map(children, (child, index) =>
        cloneElement(child as any, {
          ...child.props,
          key: index,
          value: items[index]
        })
      )}
    </ArkTabs>
  )
}

export interface ITabProps extends React.ComponentProps<'div'> {
  value: string
}

export function Tab({ children, ...props }: ITabProps) {
  return <TabContent {...props}>{children}</TabContent>
}
