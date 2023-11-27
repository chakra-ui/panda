import { ChevronDownIcon } from '@/src/components/icons'
import { UseResponsiveView } from '@/src/hooks/useResponsiveView'
import { css, cx } from '@/styled-system/css'
import { button, menu } from '@/styled-system/recipes'
import { Menu, MenuContent, MenuItem, MenuPositioner, MenuTrigger } from '@ark-ui/react'

type BreakpointControlProps = {
  setResponsiveSize: UseResponsiveView['setResponsiveSize']
  breakpoints: UseResponsiveView['breakpoints']
}

export const BreakpointControl = ({ setResponsiveSize, breakpoints }: BreakpointControlProps) => {
  const onSelectBreakpoint = (value: keyof UseResponsiveView['breakpoints']) => {
    setResponsiveSize(breakpoints[value])
  }

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }} onSelect={({ value }) => onSelectBreakpoint(value)}>
      <MenuTrigger asChild>
        <button
          title="Select a breakpoint"
          className={cx(
            button(),
            css({
              roundedLeft: '0',
              p: '0',
              '& svg': {
                width: '16px',
              },
            }),
          )}
        >
          <ChevronDownIcon />
        </button>
      </MenuTrigger>
      <MenuPositioner className={menu()}>
        <MenuContent>
          {Object.keys(breakpoints).map((breakpoint) => (
            <MenuItem
              className={css({
                color: 'text.complementary',
              })}
              key={breakpoint}
              id={breakpoint}
            >
              {breakpoint}
            </MenuItem>
          ))}
        </MenuContent>
      </MenuPositioner>
    </Menu.Root>
  )
}
