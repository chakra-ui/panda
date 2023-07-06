import { HorizontalSplit, VerticalSplit } from '@/src/components/icons'
import { css } from '@/styled-system/css'
import { Segment, SegmentControl, SegmentGroup, SegmentIndicator, SegmentInput, SegmentLabel } from '@ark-ui/react'

export type Layout = 'horizontal' | 'vertical'
export type LayoutControlProps = {
  value: Layout
  onChange: (layout: Layout) => void
}

export const LayoutControl = (props: LayoutControlProps) => {
  const { value, onChange } = props
  const options = [
    { id: 'horizontal', label: 'Horizontal', icon: <HorizontalSplit /> },
    { id: 'vertical', label: 'Vertical', icon: <VerticalSplit /> },
    // { id: 'desktop', label: 'Desktop' },
    // { id: 'mobile', label: 'Mobile' },
  ]
  return (
    <SegmentGroup
      className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        p: '1',
        ml: 'auto',
        bg: { base: 'gray.100', _dark: '#3A3A3AFF' },
        borderRadius: 'sm',
      })}
      value={value}
      onChange={(e) => onChange(e.value as any)}
    >
      <SegmentIndicator
        className={css({
          background: 'primary',
          zIndex: '0',
          boxShadow: 'xs',
          borderRadius: 'sm',
        })}
      />
      {options.map((option, id) => (
        <Segment
          className={css({
            zIndex: '1',
            position: 'relative',
            fontWeight: 'semibold',
            color: '#FFFFFF4D',
            p: '1',
            cursor: 'pointer',
            display: 'flex',
          })}
          key={id}
          value={option.id}
          aria-label={option.label}
          title={option.label}
        >
          <SegmentLabel
            className={css({
              alignSelf: 'center',
              color: { base: 'text.default', _checked: 'black' },
              transition: 'color 170ms ease-in-out',
            })}
          >
            {option.icon}
          </SegmentLabel>
          <SegmentInput />
          <SegmentControl />
        </Segment>
      ))}
    </SegmentGroup>
  )
}
