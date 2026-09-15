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
  tone?: 'neutral' | 'accent' | 'pill' | 'card'
  orientation?: 'horizontal' | 'vertical'
}

export function Segmented(props: Props) {
  const { label, options, value, onValueChange, size, tone, orientation } =
    props
  const classes = segmented({ size, tone })
  return (
    <SegmentGroup.Root
      className={classes.root}
      value={value}
      orientation={orientation}
      onValueChange={details => {
        if (details.value) onValueChange(details.value)
      }}
      aria-label={label}
    >
      <SegmentGroup.Indicator className={classes.indicator} />
      {options.map(option => (
        <SegmentGroup.Item
          key={option.value}
          value={option.value}
          className={classes.item}
        >
          {option.icon && <span aria-hidden>{option.icon}</span>}
          <SegmentGroup.ItemText className={classes.itemText}>
            {option.label}
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      ))}
    </SegmentGroup.Root>
  )
}
