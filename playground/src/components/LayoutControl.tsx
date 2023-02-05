import { css } from '@/design-system/css'
import { Radio, RadioControl, RadioGroup, RadioInput, RadioLabel } from '@ark-ui/react'

export type Layout = 'horizontal' | 'vertical'
export type LayoutControlProps = {
  value: Layout
  onChange: (layout: Layout) => void
}

export const LayoutControl = (props: LayoutControlProps) => {
  const { value, onChange } = props
  const options = [
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'vertical', label: 'Vertical' },
    // { id: 'desktop', label: 'Desktop' },
    // { id: 'mobile', label: 'Mobile' },
  ]
  return (
    <RadioGroup
      value={value}
      onChange={({ value }) => onChange(value as Layout)}
      className={css({ display: 'flex', gap: 3 })}
    >
      {options.map((option, id) => (
        <Radio key={id} value={option.id} style={{ fontWeight: option.id === value ? 'bold' : 'inherit' }}>
          <RadioLabel>{option.label}</RadioLabel>
          <RadioInput />
          <RadioControl />
        </Radio>
      ))}
    </RadioGroup>
  )
}
