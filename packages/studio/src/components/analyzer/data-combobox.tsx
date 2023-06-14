import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxPositioner,
  ComboboxTrigger,
  Portal,
} from '@ark-ui/react'
import { useEffect, useState } from 'react'
import { css } from '../../../styled-system/css'
import { panda } from '../../../styled-system/jsx'

export type DataComboboxOption = {
  value: string
  label: string
}

export type DataComboboxProps = {
  options: DataComboboxOption[]
  label?: React.ReactNode
  placeholder?: string
  filterFn?: (value: string) => DataComboboxOption[]
  defaultValue?: string
  onSelect?: (option: any) => void
}

export const DataCombobox = ({ options: allOptions, label, ...props }: DataComboboxProps) => {
  const [options, setOptions] = useState(allOptions)
  const filterFn =
    props.filterFn ||
    ((value: string) => allOptions.filter((item) => item.label.toLowerCase().includes(value.toLowerCase())))

  // sync available options from parent
  useEffect(() => {
    setOptions(allOptions)
  }, [allOptions])

  return (
    <Combobox openOnClick {...props} className={css({ m: 4 })}>
      {(state: any) => {
        return (
          <>
            <ComboboxControl>
              <panda.div display="flex" flexDirection="column">
                {label && (
                  <ComboboxLabel>
                    <panda.span fontWeight="bold">{label}</panda.span>
                  </ComboboxLabel>
                )}
                <panda.div
                  display="flex"
                  _focus={{
                    border: '1px solid token(colors.blue.400, blue)',
                  }}
                >
                  <ComboboxInput
                    defaultValue={props.defaultValue}
                    placeholder={props.placeholder ?? 'Search...'}
                    className={css({ width: 'full', p: 2 })}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value) {
                        props?.onSelect?.({ relatedTarget: null })
                        setOptions(allOptions)
                        state.clearValue()
                        return
                      }

                      setOptions(filterFn(value))
                    }}
                  />
                  {state.selectedValue && (
                    <panda.span
                      px="2"
                      mr="-2"
                      cursor="pointer"
                      userSelect="none"
                      fontSize="lg"
                      fontWeight="bold"
                      onClick={() => state.clearValue()}
                    >
                      X
                    </panda.span>
                  )}
                  <ComboboxTrigger>
                    <panda.span ml="auto" px="2" cursor="pointer">
                      {state.isOpen ? '▲' : '▼'}
                    </panda.span>
                  </ComboboxTrigger>
                </panda.div>
              </panda.div>
            </ComboboxControl>
            <Portal>
              <ComboboxPositioner>
                <ComboboxContent
                  className={css({
                    maxHeight: '300px',
                    overflow: 'auto',
                    padding: '4px 8px',
                    bg: 'card',
                    listStyle: 'none',
                    rounded: 'md',
                    border: '1px solid token(colors.border)',
                  })}
                >
                  {/* TODO virtualization */}
                  {options.map((option) => (
                    <ComboboxOption
                      key={option.label + '-' + option.value}
                      value={option.value}
                      label={option.label}
                      className={css({
                        padding: '4px 8px',
                        _highlighted: {
                          bg: 'border',
                        },
                      })}
                    />
                  ))}
                </ComboboxContent>
              </ComboboxPositioner>
            </Portal>
          </>
        )
      }}
    </Combobox>
  )
}
