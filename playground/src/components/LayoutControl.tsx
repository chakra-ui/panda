import { HorizontalSplit, PreviewLayout, VerticalSplit } from '@/src/components/icons'
import { css, cx } from '@/styled-system/css'
import { Segment, SegmentControl, SegmentGroup, SegmentIndicator, SegmentInput, SegmentLabel } from '@ark-ui/react'
import { segmentGroup } from '@/styled-system/recipes'

export type Layout = 'horizontal' | 'vertical' | 'preview'
export type LayoutControlProps = {
  value: Layout
  onChange: (layout: Layout) => void
}

export const LayoutControl = (props: LayoutControlProps) => {
  const { value, onChange } = props
  const options = [
    { id: 'horizontal', label: 'Horizontal', icon: <HorizontalSplit /> },
    { id: 'vertical', label: 'Vertical', icon: <VerticalSplit /> },
    { id: 'preview', label: 'Preview', icon: <PreviewLayout /> },
    // { id: 'responsive', label: 'Responsive' },
  ]
  return (
    <SegmentGroup
      className={cx(
        segmentGroup(),
        css({
          gap: '2',
          p: '1',
          bg: { base: 'gray.100', _dark: '#3A3A3AFF' },
          borderRadius: 'sm',
        }),
      )}
      value={value}
      onChange={(e) => onChange(e.value as any)}
    >
      <SegmentIndicator />
      {options.map((option, id) => (
        <Segment
          className={css({
            p: '1',
          })}
          key={id}
          value={option.id}
          aria-label={option.label}
          title={option.label}
        >
          <SegmentLabel>{option.icon}</SegmentLabel>
          <SegmentInput />
          <SegmentControl />
        </Segment>
      ))}
    </SegmentGroup>
  )
}
