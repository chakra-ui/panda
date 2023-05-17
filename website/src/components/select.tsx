import type { ReactElement } from 'react'
import {
  Select as ArkSelect,
  SelectContent,
  SelectOption,
  SelectPositioner,
  SelectTrigger,
  Portal,
  SelectProps
} from '@ark-ui/react'
import { CheckIcon } from 'nextra/icons'
import { css, cx } from '../../styled-system/css'

type MenuOption = {
  value: NonNullable<SelectProps['selectedOption']>['value']
  label: ReactElement | NonNullable<SelectProps['selectedOption']>['label']
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
}: MenuProps): ReactElement {
  return (
    <ArkSelect onChange={onChange}>
      {({ isOpen }) => (
        <>
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
                  // _dark: { bg: 'primary.100/10', color: 'gray.50' } // opacity modifier
                  _dark: { bg: 'rgb(219 234 254 / 0.1)', color: 'gray.50' }
                },
                _hover: {
                  bg: 'gray.100',
                  color: 'gray.900',
                  // _dark: { bg: 'primary.100/5', color: 'gray.50' }
                  _dark: {
                    bg: 'rgb(219 234 254 / 0.1)',
                    color: 'gray.50'
                  } // opacity modifier
                }
              }),
              className
            )}
          >
            {(selected?.label as any) ?? title}
          </SelectTrigger>
          <Portal>
            <div
              className={css({
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none',
                transitionProperty: 'opacity'
              })}
            >
              <SelectPositioner
                className={css({
                  zIndex: 20,
                  maxHeight: 64,
                  overflow: 'auto',
                  borderRadius: 'md',
                  outline: '1px',
                  // outlineColor: 'black/5',
                  outlineColor: 'rgb(0 0 0 / 0.05)',
                  bg: 'white',
                  py: 1,
                  fontSize: 'sm',
                  shadow: 'lg',
                  _dark: {
                    // outlineColor: 'white/20',
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
                        _dark: { color: 'gray.100' },
                        _hover: {
                          bg: 'primary.50',
                          color: 'primary.600',
                          // _dark: { bg: 'primary.500/10' }
                          _dark: { bg: 'rgb(59 130 246 / 0.1)' }
                        },
                        position: 'relative',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        py: 1.5,
                        transitionProperty: 'colors',
                        _ltr: { pl: 3, pr: 9 },
                        _rtl: { pr: 3, pl: 9 }
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
                            _ltr: { right: 3 },
                            _rtl: { left: 3 }
                          })}
                        >
                          <CheckIcon />
                        </span>
                      )}
                    </SelectOption>
                  ))}
                </SelectContent>
              </SelectPositioner>
            </div>
          </Portal>
        </>
      )}
    </ArkSelect>
  )
}
