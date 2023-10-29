import {
  HorizontalSplit,
  PreviewLayout,
  ResponsiveLayout,
  VerticalSplit,
} from '@/components/icons'
import { css, cx } from 'styled-system/css'
import {
  Segment,
  SegmentControl,
  SegmentGroup,
  SegmentLabel,
  SegmentGroupIndicator,
} from '@ark-ui/react'
import { segmentGroup } from 'styled-system/recipes'

export type Layout = 'horizontal' | 'vertical' | 'preview' | 'responsive'
export type LayoutControlProps = {
  value: Layout
  onChange: (layout: Layout) => void
  isResponsive: boolean
}

export const LayoutControl = (props: LayoutControlProps) => {
  const { value, onChange, isResponsive } = props
  const options = [
    { id: 'horizontal', label: 'Horizontal', icon: <HorizontalSplit /> },
    { id: 'vertical', label: 'Vertical', icon: <VerticalSplit /> },
    { id: 'preview', label: 'Preview', icon: <PreviewLayout /> },
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
        })
      )}
      value={value}
      onChange={(e) => onChange(e.value as any)}
    >
      <SegmentGroupIndicator />
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
          <SegmentControl />
        </Segment>
      ))}
      <button
        data-active={isResponsive ? '' : undefined}
        title='Toggle Responsive view'
        className={css({
          p: '1',
          cursor: 'pointer',
          color: { base: 'text.default', _active: 'text.complementary' },
        })}
        onClick={() => onChange('responsive')}
      >
        <span>
          <ResponsiveLayout />
        </span>
      </button>
    </SegmentGroup>
  )
}
