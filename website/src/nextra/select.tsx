import { css, cx } from '@/styled-system/css'
import {
  Select as ArkSelect,
  Portal,
  SelectContent,
  SelectOption,
  SelectPositioner,
  SelectTrigger
} from '@ark-ui/react'
import { CheckIcon } from 'nextra/icons'

type MenuOption = {
  value: string
  label: React.ReactNode
}

interface MenuProps {
  selected: MenuOption
  onChange: (option: MenuOption | null) => void
  options: MenuOption[]
  title?: string
  className?: string
}

export function Select({
  options,
  selected,
  onChange,
  title,
  className
}: MenuProps) {
  return (
    <ArkSelect onChange={onChange}>
      <SelectTrigger
        className={cx(
          css({
            height: 7,
            borderRadius: 'md',
            px: 2,
            textAlign: 'left',
            fontSize: 'xs',
            fontWeight: 'medium',
            color: 'gray.600',
            transitionProperty: 'colors',
            _dark: { color: 'gray.400' },
            _expanded: {
              bg: 'gray.200',
              color: 'gray.900',
              _dark: {
                color: 'gray.50',
                bg: 'whiteAlpha.300'
              }
            },
            _hover: {
              bg: 'blackAlpha.200',
              color: 'gray.900',
              _dark: {
                bg: 'rgb(219 234 254 / 0.1)',
                color: 'gray.50'
              }
            }
          }),
          className
        )}
      >
        {(selected?.label as any) ?? title}
      </SelectTrigger>
      <Portal>
        <SelectPositioner
          className={css({
            zIndex: 20,
            maxHeight: 64,
            overflow: 'auto',
            borderRadius: 'md',
            outlineWidth: '1px',
            outlineColor: 'rgb(0 0 0 / 0.05)',
            bg: 'white',
            py: '1',
            fontSize: 'sm',
            shadow: 'lg',
            _dark: {
              outlineColor: 'rgb(255 255 255 / 0.2)',
              bg: 'neutral.800'
            }
          })}
        >
          <SelectContent>
            {options.map(option => (
              <SelectOption
                key={option.value}
                value={option.value}
                label={option.label as any}
                className={css({
                  color: 'gray.800',
                  _dark: {
                    color: 'gray.100'
                  },
                  _hover: {
                    bg: 'yellow.200',
                    color: 'black',
                    _dark: {
                      bg: 'yellow.300',
                      color: 'black'
                    }
                  },
                  position: 'relative',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  py: 1.5,
                  transitionProperty: 'colors',
                  ps: '3',
                  pe: '9'
                })}
              >
                {option.label}
                {option.value === selected.value && (
                  <span
                    className={css({
                      position: 'absolute',
                      insetY: 0,
                      display: 'flex',
                      alignItems: 'center',
                      insetEnd: '3'
                    })}
                  >
                    <CheckIcon />
                  </span>
                )}
              </SelectOption>
            ))}
          </SelectContent>
        </SelectPositioner>
      </Portal>
    </ArkSelect>
  )
}
