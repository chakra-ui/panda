import type { ReactElement, ReactNode } from 'react'
import cn from 'clsx'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon } from 'nextra/icons'
import { usePopper } from '../utils'
import { createPortal } from 'react-dom'
import { useMounted } from 'nextra/hooks'
import { css } from '../../styled-system/css'

interface MenuOption {
  key: string
  name: ReactElement | string
}

interface MenuProps {
  selected: MenuOption
  onChange: (option: MenuOption) => void
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
  const [trigger, container] = usePopper({
    strategy: 'fixed',
    placement: 'top-start',
    modifiers: [
      { name: 'offset', options: { offset: [0, 10] } },
      {
        name: 'sameWidth',
        enabled: true,
        fn({ state }) {
          state.styles.popper.minWidth = `${state.rects.reference.width}px`
        },
        phase: 'beforeWrite',
        requires: ['computeStyles']
      }
    ]
  })

  return (
    <Listbox value={selected} onChange={onChange}>
      {({ open }) => (
        <Listbox.Button
          ref={trigger}
          title={title}
          className={cn(
            css({
              height: 7,
              borderRadius: 'md',
              px: 2,
              textAlign: 'left',
              fontSize: 'xs',
              fontWeight: 'medium',
              color: 'gray.600',
              transitionProperty: 'colors',
              _dark: { color: 'gray.400' }
            }),
            open
              ? css({
                  bg: 'gray.200',
                  color: 'gray.900',
                  // _dark: { bg: 'primary.100/10', color: 'gray.50' } // opacity modifier
                  _dark: { bg: 'rgb(219 234 254 / 0.1)', color: 'gray.50' }
                })
              : css({
                  _hover: {
                    bg: 'gray.100',
                    color: 'gray.900',
                    // _dark: { bg: 'primary.100/5', color: 'gray.50' }
                    _dark: { bg: 'rgb(219 234 254 / 0.1)', color: 'gray.50' } // opacity modifier
                  }
                }),
            className
          )}
        >
          {selected.name}
          <Portal>
            <Transition
              // @ts-expect-error TODO: fix Property 'ref' does not exist on type
              ref={container}
              show={open}
              as={Listbox.Options}
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
              leave={css({ transitionProperty: 'opacity' })}
              leaveFrom={css({ opacity: 1 })}
              leaveTo={css({ opacity: 0 })}
            >
              {options.map(option => (
                <Listbox.Option
                  key={option.key}
                  value={option}
                  className={({ active }) =>
                    cn(
                      active
                        ? css({
                            bg: 'primary.50',
                            color: 'primary.600',
                            // _dark: { bg: 'primary.500/10' }
                            _dark: { bg: 'rgb(59 130 246 / 0.1)' }
                          })
                        : css({
                            color: 'gray.800',
                            _dark: { color: 'gray.100' }
                          }),
                      css({
                        position: 'relative',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        py: 1.5
                      }),
                      css({
                        transitionProperty: 'colors',
                        _ltr: { pl: 3, pr: 9 },
                        _rtl: { pr: 3, pl: 9 }
                      })
                    )
                  }
                >
                  {option.name}
                  {option.key === selected.key && (
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
                </Listbox.Option>
              ))}
            </Transition>
          </Portal>
        </Listbox.Button>
      )}
    </Listbox>
  )
}

function Portal(props: { children: ReactNode }): ReactElement | null {
  const mounted = useMounted()
  if (!mounted) return null
  return createPortal(props.children, document.body)
}
