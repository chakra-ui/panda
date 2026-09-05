'use client'

import { CheckIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Portal } from '@ark-ui/react/portal'
import { createListCollection, Select } from '@ark-ui/react/select'
import { useMemo } from 'react'
import { LuChevronDown } from 'react-icons/lu'

interface Props<T extends string> {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
}

/** A field-shaped select for filtering the post list. The menu matches the trigger's width. */
export function PostFilter<T extends string>(props: Props<T>) {
  const { label, options, value, onChange } = props
  const collection = useMemo(
    () =>
      createListCollection({
        items: options.map(item => ({ value: item, label: item }))
      }),
    [options]
  )

  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={e => {
        const next = e.value[0] as T | undefined
        if (next) onChange(next)
      }}
      positioning={{ sameWidth: true, gutter: 6 }}
    >
      <Select.Trigger aria-label={label} className={trigger}>
        <Select.ValueText />
        <Select.Indicator asChild>
          <LuChevronDown aria-hidden className={chevron} />
        </Select.Indicator>
      </Select.Trigger>
      <Portal>
        <Select.Positioner>
          <Select.Content className={menu}>
            {collection.items.map(item => (
              <Select.Item key={item.value} item={item} className={option}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator asChild>
                  <CheckIcon className={check} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}

const trigger = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  minW: '12rem',
  height: '11',
  px: '4',
  rounded: 'md',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'fg',
  bg: 'bg',
  borderWidth: '1px',
  borderColor: 'border',
  cursor: 'pointer',
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  _hover: { bg: 'bg.subtle' },
  _expanded: { bg: 'bg.subtle' },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '2px'
  }
})

const chevron = css({
  color: 'fg.subtle',
  transitionProperty: 'transform',
  transitionDuration: '150ms',
  '[data-state=open] &': { transform: 'rotate(180deg)' }
})

const menu = css({
  zIndex: 20,
  py: '1',
  rounded: 'md',
  bg: 'bg.surface',
  borderWidth: '1px',
  borderColor: 'border',
  shadow: 'lg',
  outline: 'none'
})

const option = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  px: '4',
  py: '2',
  fontSize: 'sm',
  color: 'fg',
  cursor: 'pointer',
  _highlighted: { bg: 'bg.subtle' },
  _selected: { fontWeight: 'medium' }
})

const check = css({
  color: 'fg.muted'
})
