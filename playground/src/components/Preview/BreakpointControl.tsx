import { ChevronDownIcon } from '@/src/components/icons'
import { UseResponsiveView } from '@/src/hooks/useResponsiveView'
import { css, cx } from '@/styled-system/css'
import { button, menu } from '@/styled-system/recipes'
import { Menu } from '@ark-ui/react/menu'

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
      <Menu.Trigger asChild>
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
      </Menu.Trigger>
      <Menu.Positioner className={menu()}>
        <Menu.Content>
          {Object.keys(breakpoints).map((breakpoint) => (
            <Menu.Item
              className={css({
                color: 'text.complementary',
              })}
              key={breakpoint}
              value={breakpoint}
            >
              {breakpoint}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}
