import { Children, ComponentProps, ReactElement, cloneElement } from 'react'
import {
  TabContent,
  TabIndicator,
  TabList,
  Tabs as ArkTabs,
  TabTrigger
} from '@ark-ui/react'
import { css, cx } from '../../styled-system/css'

export function Tabs({
  items,
  children
}: {
  items: string[]
  children: ReactElement
}): ReactElement {
  console.log(items)
  const tabs = Children.map(children, (child, index) =>
    cloneElement(child as any, {
      ...child.props,
      key: index,
      value: items[index]
    })
  )

  return (
    <ArkTabs defaultValue={items[0]}>
      <div
        className={cx(
          'nextra-scrollbar',
          css({
            position: 'relative',
            overflowX: 'auto',
            overflowY: 'hidden',
            overscrollBehaviorX: 'contain'
          })
        )}
      >
        <TabList
          className={css({
            mt: 4,
            display: 'flex',
            w: 'max',
            minW: 'full',
            borderBottom: '1px solid',
            borderColor: 'gray.200',
            pb: 'px',
            _dark: { borderColor: 'neutral.800' }
          })}
        >
          {items.map((item, index) => {
            return (
              <TabTrigger value={item} key={index}>
                <button
                  className={cx(
                    css({
                      mr: 2,
                      roundedTop: 'md',
                      p: 2,
                      fontWeight: 'medium',
                      lineHeight: '1.25rem',
                      transitionProperty: 'colors',
                      mb: '-0.5',
                      userSelect: 'none',
                      borderBottom: '2px solid',
                      borderColor: 'transparent',
                      color: 'gray.600',
                      _hover: {
                        borderColor: 'gray.200',
                        color: 'black'
                      },
                      _dark: {
                        borderColor: 'neutral.800',
                        color: 'neutral.200',
                        _hover: {
                          color: 'white'
                        }
                      },
                      _selected: {
                        borderColor: 'primary.500',
                        color: 'primary.600'
                      }
                    })
                  )}
                >
                  {item}
                </button>
              </TabTrigger>
            )
          })}
          <TabIndicator
            className={css({
              height: '2px',
              bottom: '-1px',
              background: { base: 'neutral.500', _dark: 'gray.200' }
            })}
          />
        </TabList>
      </div>
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
    <TabContent {...props} className={css({ rounded: 'md', pt: 6 })}>
      {children}
    </TabContent>
  )
}
