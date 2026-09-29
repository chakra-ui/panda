'use client'

import { Button } from '@/components/ui/button'
import { getV2Href } from '@/lib/v2-url'
import { hstack } from '@/styled-system/patterns'
import { Menu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { usePathname } from 'next/navigation'
import { LuCheck, LuChevronDown } from 'react-icons/lu'

const itemClass = hstack({
  cursor: 'pointer',
  justify: 'space-between',
  gap: '2',
  px: '2',
  py: '1',
  minH: '8',
  rounded: 'sm',
  textStyle: 'sm',
  fontWeight: 'medium',
  _icon: { boxSize: '3.5' },
  _highlighted: { bg: 'bg.muted' }
})

export const VersionSwitcher = () => {
  const pathname = usePathname() ?? '/'

  return (
    <Menu.Root lazyMount positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <Button
          size="xs"
          color="neutral"
          px="2"
          py="1"
          gap="1"
          aria-label="Select docs version"
        >
          v1 <LuChevronDown />
        </Button>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            className={hstack({
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '0',
              minW: '32',
              bg: 'bg',
              p: '1',
              borderWidth: '1px',
              outline: '0',
              borderRadius: 'md',
              shadow: 'lg',
              zIndex: '30'
            })}
          >
            <Menu.Item value="v1" className={itemClass}>
              v1 <LuCheck />
            </Menu.Item>
            <Menu.Item value="v2" asChild className={itemClass}>
              <a href={getV2Href(pathname)}>v2</a>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
