import { css } from '../../../styled-system/css'
import { panda } from '../../../styled-system/jsx'
import { Portal } from '@ark-ui/react'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxPositioner,
  ComboboxTrigger,
  ComboboxProps,
} from '@ark-ui/react'
import { useState, useEffect, ReactNode } from 'react'

export type DataComboboxOption = { value: string; label: string }
export type DataComboboxProps = {
  options: Array<DataComboboxOption>
  label?: ReactNode
  filterFn?: (value: string) => DataComboboxOption[]
} & ComboboxProps

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
    <Combobox
      openOnClick
      // defaultValue={props.defaultValue} // TODO not acting as "selected"
      {...props}
    >
      {(state) => {
        return (
          <>
            <ComboboxControl>
              <panda.div display="flex" flexDirection="column">
                {label && (
                  <ComboboxLabel>
                    <panda.span fontWeight="bold">{label}</panda.span>
                  </ComboboxLabel>
                )}
                <panda.div display="flex" border="1px solid token(colors.blue.400, blue)">
                  <ComboboxInput
                    defaultValue={props.defaultValue}
                    placeholder={props.placeholder ?? 'Search...'}
                    className={css({ width: 'full' })}
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
                    bg: 'white',
                    listStyle: 'none',
                    border: '1px solid token(colors.blue.400, blue)',
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
                          outline: '1px solid token(colors.blue.400, blue)',
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
