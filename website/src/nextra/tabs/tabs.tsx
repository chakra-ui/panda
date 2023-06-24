import { cva, cx } from '@/styled-system/css'
import { TabsVariantProps } from '@/styled-system/recipes'
import {
  Tabs as ArkTabs,
  TabContent,
  TabIndicator,
  TabList,
  TabTrigger
} from '@ark-ui/react'
import { Children, cloneElement } from 'react'
import { IUseTabsProps, useTabs } from './use-tabs'

const tabsStyles = cva({
  base: {
    '&[data-scope="tabs"][data-part="root"]': {
      overflowX: 'auto',
      overflowY: 'hidden',
      overscrollBehaviorX: 'contain'
    },
    '& [data-scope="tabs"][data-part="tablist"]': {
      position: 'relative',
      mt: '4',
      display: 'flex',
      w: 'max',
      minW: 'full',
      p: 1,
      bg: 'gray.200',
      borderTopLeftRadius: 'xl',
      borderTopRightRadius: 'xl',
      _dark: {
        bg: 'gray.700'
      }
    },
    '& [data-scope="tabs"][data-part="trigger"]': {
      py: '1px',
      px: 2,
      lineHeight: '1.5rem',
      transitionProperty: 'colors',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      color: 'gray.600',
      zIndex: 1,
      fontSize: 'sm',
      fontWeight: 'medium',
      _hover: {
        color: 'gray.900'
      },
      _dark: {
        color: 'gray.300',
        _hover: {
          color: 'white',
        },
        _selected: {
          color: 'black !important',
        }
      },
      _selected: {
        color: 'black',
      }
    },
    '& [data-scope="tabs"][data-part="indicator"]': {
      position: 'absolute',
      inset: 1,
      bg: 'yellow.300',
      borderRadius: 'md',
      zIndex: 0,
    },
    '& [data-scope="tabs"][data-part="content"]': {
      bg: 'gray.100',
      borderBottomLeftRadius: 'xl',
      borderBottomRightRadius:'xl',
      _dark: {
        bg: 'gray.800'
      }
    }
  }
})

export interface ITabProps extends TabsVariantProps, IUseTabsProps {
  children: React.ReactElement[]
}

export function Tabs(props: ITabProps) {
  const { items, children, variant } = props
  const { value, onChange } = useTabs(props)

  return (
    <ArkTabs
      value={value}
      onChange={onChange}
      className={cx('nextra-scrollbar', tabsStyles({ variant }))}
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
