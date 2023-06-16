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
import { Flex, panda } from '../../../styled-system/jsx'
import { ChevronDownIcon, XMarkIcon } from '../icons'
import { inputRecipe } from '../input'

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
              <panda.div display="flex" flexDirection="column" gap="2">
                {label && (
                  <ComboboxLabel>
                    <panda.span fontWeight="bold">{label}</panda.span>
                  </ComboboxLabel>
                )}
                <panda.div display="flex" position="relative" isolation="isolate">
                  <ComboboxInput
                    defaultValue={props.defaultValue}
                    placeholder={props.placeholder ?? 'Search...'}
                    className={inputRecipe()}
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
                  <Flex
                    top="0px"
                    right="0px"
                    align="center"
                    justify="center"
                    position="absolute"
                    zIndex="2"
                    height="full"
                  >
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
                        <panda.span
                          data-expanded={state.isOpen ? '' : undefined}
                          transform={{ _expanded: 'rotate(180deg)' }}
                          transition="all .2s ease"
                        >
                          <ChevronDownIcon />
                        </panda.span>
                      </panda.span>
                    </ComboboxTrigger>
                  </Flex>
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
