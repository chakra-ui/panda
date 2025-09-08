import { css, cx } from '@/styled-system/css'
import { Portal } from '@ark-ui/react/portal'
import { createListCollection, Select } from '@ark-ui/react/select'
import { CheckIcon } from '@/icons'
import { useMemo } from 'react'

interface Item {
  value: string
  label: React.ReactNode
}

interface Props {
  selected: Item
  onChange(item: Item | null): void
  options: Item[]
  title?: string
  className?: string
}

function _Select({ options, selected, onChange, title, className }: Props) {
  const collection = useMemo(() => {
    return createListCollection({ items: options })
  }, [options])

  return (
    <Select.Root
      lazyMount
      collection={collection}
      onValueChange={e => onChange(e.items[0] ?? null)}
    >
      <Select.Trigger
        className={cx(
          css({
            height: 7,
            borderRadius: 'md',
            px: 2,
            textAlign: 'left',
            fontSize: 'xs',
            fontWeight: 'medium',
            color: 'gray.600',
            transition: 'colors',
            _dark: { color: 'gray.400' },
            _expanded: {
              bg: 'gray.200',
              color: 'gray.900',
              _dark: {
                color: 'gray.50',
                bg: 'whiteAlpha.300'
              }
            },
            _hover: {
              bg: 'blackAlpha.200',
              color: 'gray.900',
              _dark: {
                bg: 'rgb(219 234 254 / 0.1)',
                color: 'gray.50'
              }
            }
          }),
          className
        )}
      >
        {(selected?.label as any) ?? title}
      </Select.Trigger>
      <Portal>
        <Select.Positioner
          className={css({
            maxHeight: 64,
            overflow: 'auto',
            borderRadius: 'md',
            outlineWidth: '1px',
            outlineColor: 'rgb(0 0 0 / 0.05)',
            bg: 'white',
            py: '1',
            fontSize: 'sm',
            shadow: 'lg',
            _dark: {
              outlineColor: 'rgb(255 255 255 / 0.2)',
              bg: 'neutral.800'
            }
          })}
        >
          <Select.Content
            className={css({
              zIndex: 20
            })}
          >
            {options.map(option => (
              <Select.Item
                item={option}
                key={option.value}
                className={css({
                  color: 'gray.800',
                  _dark: {
                    color: 'gray.100'
                  },
                  _hover: {
                    bg: 'yellow.200',
                    color: 'black',
                    _dark: {
                      bg: 'yellow.300',
                      color: 'black'
                    }
                  },
                  position: 'relative',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  py: 1.5,
                  transition: 'colors',
                  ps: '3',
                  pe: '9'
                })}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon
                    className={css({
                      position: 'absolute',
                      right: '3',
                      top: '2',
                      insetEnd: '3'
                    })}
                  />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}

export { _Select as Select }
