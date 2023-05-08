import type { ComponentProps, ReactElement, ReactNode } from 'react'
import cn from 'clsx'
import { Tab as HeadlessTab } from '@headlessui/react'
import { css } from '../../styled-system/css'

type TabItem = {
  label: ReactElement
  disabled?: boolean
}

function isTabItem(item: unknown): item is TabItem {
  if (item && typeof item === 'object' && 'label' in item) return true
  return false
}

const renderTab = (item: ReactNode | TabItem) => {
  if (isTabItem(item)) {
    return item.label
  }
  return item
}

export function Tabs({
  items,
  selectedIndex,
  defaultIndex,
  onChange,
  children
}: {
  items: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[]
  selectedIndex?: number
  defaultIndex?: number
  onChange?: (index: number) => void
  children: ReactNode
}): ReactElement {
  return (
    <HeadlessTab.Group
      selectedIndex={selectedIndex}
      defaultIndex={defaultIndex}
      onChange={onChange}
    >
      <div
        className={cn('nextra-scrollbar', {
          overflowX: 'auto',
          overflowY: 'hidden',
          overscrollX: 'contain'
        })}
      >
        <HeadlessTab.List
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
            const disabled = !!(
              item &&
              typeof item === 'object' &&
              'disabled' in item &&
              item.disabled
            )

            return (
              <HeadlessTab
                key={index}
                disabled={disabled}
                className={({ selected }) =>
                  cn(
                    css({
                      mr: 2,
                      roundedTop: 'md',
                      p: 2,
                      fontWeight: 'medium',
                      lineHeight: '1.25rem',
                      transitionProperty: 'colors',
                      mb: '-0.5',
                      userSelect: 'none',
                      borderBottom: '2px solid '
                    }),
                    selected
                      ? css({
                          borderColor: 'primary.500',
                          color: 'primary.600'
                        })
                      : css({
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
                          }
                        }),
                    disabled &&
                      css({
                        pointerEvents: 'none',
                        color: 'gray.400',
                        _dark: { color: 'neutral.600' }
                      })
                  )
                }
              >
                {renderTab(item)}
              </HeadlessTab>
            )
          })}
        </HeadlessTab.List>
      </div>
      <HeadlessTab.Panels>{children}</HeadlessTab.Panels>
    </HeadlessTab.Group>
  )
}

export function Tab({
  children,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <HeadlessTab.Panel {...props} className={css({ rounded: 'md', pt: 6 })}>
      {children}
    </HeadlessTab.Panel>
  )
}
