'use client'

import {
  communityContent,
  communityItem,
  communityTrigger
} from '@/components/docs/tab-bar'
import { getV1Href } from '@/lib/v1-href'
import { css } from '@/styled-system/css'
import { Menu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { usePathname } from 'next/navigation'
import { LuCheck, LuChevronDown } from 'react-icons/lu'

const V1_VERSION = '1.12.1'
const V2_VERSION = process.env.NEXT_PUBLIC_PANDA_VERSION

export function VersionSwitcher() {
  const pathname = usePathname() ?? '/'

  return (
    <Menu.Root lazyMount positioning={{ placement: 'bottom-start' }}>
      <Menu.Trigger aria-label="Docs version" className={trigger}>
        v2
        <LuChevronDown size={14} aria-hidden />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className={css(communityContent, { minW: '10rem' })}>
            <Menu.Item value="v2" className={communityItem}>
              <VersionLabel major="v2" version={V2_VERSION} />
              <LuCheck size={14} aria-hidden />
            </Menu.Item>
            <Menu.Item value="v1" asChild className={communityItem}>
              <a href={getV1Href(pathname)}>
                <VersionLabel major="v1" version={V1_VERSION} />
              </a>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

function VersionLabel(props: { major: string; version?: string }) {
  return (
    <span className={css({ display: 'flex', alignItems: 'baseline', gap: '2' })}>
      {props.major}
      {props.version ? (
        <span className={css({ color: 'fg.subtle', textStyle: 'xs' })}>
          {props.version}
        </span>
      ) : null}
    </span>
  )
}

const trigger = css(communityTrigger, {
  gap: '1',
  flexShrink: '0',
  fontWeight: 'medium',
  px: '2.5',
  py: '1.5',
  h: 'auto',
  borderWidth: '1px',
  borderColor: 'border',
  _open: { bg: 'bg.subtle' }
})
