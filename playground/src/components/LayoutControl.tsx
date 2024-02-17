import { BreakpointControl } from '@/src/components/Preview/BreakpointControl'
import { HorizontalSplit, PreviewLayout, ResponsiveLayout, VerticalSplit } from '@/src/components/icons'
import { UseResponsiveView } from '@/src/hooks/useResponsiveView'
import { css, cx } from '@/styled-system/css'
import { button, segmentGroup } from '@/styled-system/recipes'
import { SegmentGroup } from '@ark-ui/react'

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
    <SegmentGroup.Root
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
      onValueChange={(e) => onChange(e.value as any)}
    >
      <SegmentGroup.Indicator
        className={css({
          width: 'var(--width)',
          height: 'var(--height)',
          top: 'var(--top)',
          left: 'var(--left)',
        })}
      />
      {options.map((option, id) => (
        <SegmentGroup.Item
          className={css({
            p: '1',
          })}
          key={id}
          value={option.id}
          aria-label={option.label}
          title={option.label}
        >
          <SegmentGroup.ItemText>{option.icon}</SegmentGroup.ItemText>
          <SegmentGroup.ItemControl />
        </SegmentGroup.Item>
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
    </SegmentGroup.Root>
  )
}
