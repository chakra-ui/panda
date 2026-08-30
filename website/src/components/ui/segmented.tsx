'use client'

import { SegmentGroup } from '@ark-ui/react/segment-group'
import { segmented } from '@/styled-system/recipes'

export interface SegmentedOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface Props {
  label: string
  options: SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
  size?: 'sm' | 'md'
  tone?: 'neutral' | 'accent'
  orientation?: 'horizontal' | 'vertical'
}

export function Segmented(props: Props) {
  const { label, options, value, onValueChange, size, tone, orientation } =
    props
  return (
    <SegmentGroup.Root
      className={segmented({ size, tone })}
      value={value}
      orientation={orientation}
      onValueChange={details => {
        if (details.value) onValueChange(details.value)
      }}
      aria-label={label}
    >
      <SegmentGroup.Indicator />
      {options.map(option => (
        <SegmentGroup.Item
          key={option.value}
          value={option.value}
        >
          <SegmentGroup.ItemText>
            {option.icon}
            {option.label}
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  )
}
