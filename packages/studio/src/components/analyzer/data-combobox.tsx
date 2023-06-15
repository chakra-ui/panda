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
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '../icons'

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
                  rounded="sm"
                  border="solid 1px"
                  borderColor={{ base: 'border', _focusWithin: { base: 'yellow.200', _dark: 'yellow.300' } }}
                >
                  <ComboboxInput
                    defaultValue={props.defaultValue}
                    placeholder={props.placeholder ?? 'Search...'}
                    className={css({
                      width: 'full',
                      p: 2,
                      color: 'text',
                      bg: 'transparent',
                      _focus: { outline: 'none' },
                    })}
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
                      display="flex"
                      px="2"
                      cursor="pointer"
                      userSelect="none"
                      onClick={() => state.clearValue()}
                      alignItems="center"
                    >
                      <XMarkIcon />
                    </panda.span>
                  )}
                  <ComboboxTrigger>
                    <panda.span
                      ml="auto"
                      p="2"
                      display="flex"
                      cursor="pointer"
                      borderLeft="solid 1px"
                      borderColor="border"
                      color="text"
                    >
                      {state.isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
                    shadow: 'sm',
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
                        rounded: 'md',
                        wordWrap: 'break-word',
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
