import { cx } from '@/styled-system/css'
import { nextraTabs } from '@/styled-system/recipes'
import { Tabs } from '@ark-ui/react/tabs'
import { Children, cloneElement } from 'react'
import { IUseTabsProps, useTabs } from './use-tabs'

export interface ITabProps extends IUseTabsProps {
  children: React.ReactElement[]
}

function _Tabs(props: ITabProps) {
  const { items, children } = props
  const { value, onChange } = useTabs(props)

  return (
    <Tabs.Root
      value={value}
      onValueChange={e => onChange(e.value)}
      className={cx('nextra-scrollbar', nextraTabs())}
    >
      <Tabs.List>
        {items.map((item, index) => {
          return (
            <Tabs.Trigger value={item} key={index}>
              {item}
            </Tabs.Trigger>
          )
        })}
        <Tabs.Indicator />
      </Tabs.List>
      {Children.map(children, (child, index) =>
        cloneElement(child as any, {
          ...child.props,
          key: index,
          value: items[index]
        })
      )}
    </Tabs.Root>
  )
}

export interface ITabProps extends React.ComponentPropsWithRef<'div'> {
  value: string
}

export function _Tab({ children, ...props }: ITabProps) {
  return <Tabs.Content {...props}>{children}</Tabs.Content>
}

export { _Tabs as Tabs, _Tab as Tab }
