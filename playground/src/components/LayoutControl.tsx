import { HorizontalSplit, PreviewLayout, ResponsiveLayout, VerticalSplit } from '@/src/components/icons'
import { css, cx } from '@/styled-system/css'
import { Segment, SegmentControl, SegmentGroup, SegmentLabel, SegmentGroupIndicator } from '@ark-ui/react'
import { button, segmentGroup } from '@/styled-system/recipes'
import { UseResponsiveView } from '@/src/hooks/useResponsiveView'
import { BreakpointControl } from '@/src/components/Preview/BreakpointControl'

export type Layout = 'horizontal' | 'vertical' | 'preview' | 'responsive'
export type LayoutControlProps = {
  value: Layout
  onChange: (layout: Layout) => void
  setResponsiveSize: UseResponsiveView['setResponsiveSize']
  breakpoints: UseResponsiveView['breakpoints']
  isResponsive: boolean
}

export const LayoutControl = (props: LayoutControlProps) => {
  const { value, onChange, setResponsiveSize, breakpoints, isResponsive } = props
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
        }),
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
      <div
        data-selected={isResponsive ? '' : undefined}
        className={css({
          display: 'flex',
          color: { base: 'text.default', _selected: 'text.complementary' },
        })}
      >
        <button
          title="Toggle Responsive view"
          className={cx(
            button(),
            css({
              roundedRight: '0',
              p: '1',
            }),
          )}
          onClick={() => onChange('responsive')}
        >
          <span>
            <ResponsiveLayout />
          </span>
        </button>
        <BreakpointControl
          setResponsiveSize={(size) => {
            if (!isResponsive) onChange('responsive')
            setResponsiveSize(size)
          }}
          breakpoints={breakpoints}
        />
      </div>
    </SegmentGroup>
  )
}
