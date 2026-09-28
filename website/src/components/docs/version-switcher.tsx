'use client'

import { communityContent, communityItem } from '@/components/docs/tab-bar'
import { getV1Href } from '@/lib/v1-href'
import { css, cx } from '@/styled-system/css'
import { Menu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { usePathname } from 'next/navigation'
import { LuArrowUpRight, LuCheck, LuChevronDown } from 'react-icons/lu'

export function VersionSwitcher() {
  const pathname = usePathname() ?? '/'

  return (
    <Menu.Root lazyMount positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger aria-label="Docs version" className={trigger}>
        v2
        <LuChevronDown size={14} aria-hidden />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            className={cx(communityContent, css({ minW: '10rem' }))}
          >
            <Menu.Item value="v2" className={communityItem}>
              v2
              <LuCheck size={14} aria-hidden />
            </Menu.Item>
            <Menu.Item value="v1" asChild className={communityItem}>
              <a href={getV1Href(pathname)}>
                v1
                <LuArrowUpRight size={13} aria-hidden />
              </a>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

const trigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',
  flexShrink: '0',
  textStyle: 'sm',
  fontWeight: 'medium',
  px: '2.5',
  py: '1.5',
  rounded: 'md',
  borderWidth: '1px',
  borderColor: 'border',
  color: 'fg.muted',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transitionProperty: 'color, background-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', bg: 'bg.subtle' },
  _open: { color: 'fg', bg: 'bg.subtle' }
})
