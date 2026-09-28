'use client'

import { communityLinks } from '@/docs.config'
import { css } from '@/styled-system/css'
import { Menu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import { LuArrowUpRight, LuChevronDown, LuHeart, LuUsers } from 'react-icons/lu'

export function SponsorLink() {
  return (
    <a
      href="https://opencollective.com/chakra-ui"
      target="_blank"
      rel="noopener noreferrer"
      className={css({
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        textStyle: 'sm',
        fontWeight: 'semibold',
        color: 'fg.muted',
        px: '3',
        py: '3',
        whiteSpace: 'nowrap',
        rounded: 'md',
        transitionProperty: 'color, background',
        transitionDuration: '200ms',
        _hover: { color: 'fg', bg: 'bg.subtle' }
      })}
    >
      <LuHeart
        size={16}
        fill="currentColor"
        className={css({ color: 'red.500' })}
      />
      Sponsor
    </a>
  )
}

export function CommunityMenu() {
  return (
    <Menu.Root lazyMount positioning={{ placement: 'top-start' }}>
      <Menu.Trigger className={communityTrigger}>
        <LuUsers size={16} />
        Community
        <LuChevronDown size={14} />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className={menuContent}>
            {communityLinks.map(link => (
              <Menu.Item
                key={link.title}
                value={link.title}
                asChild
                className={menuItem}
              >
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                >
                  {link.title}
                  {link.external && <LuArrowUpRight size={13} />}
                </a>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

const communityTrigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  textStyle: 'sm',
  fontWeight: 'semibold',
  px: '3',
  py: '3',
  h: 'full',
  rounded: 'md',
  whiteSpace: 'nowrap',
  color: 'fg.muted',
  cursor: 'pointer',
  transitionProperty: 'color, background-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', bg: 'bg.subtle' },
  _open: { color: 'fg' }
})

export const menuContent = css({
  minW: '13rem',
  bg: 'bg',
  borderWidth: '1px',
  borderColor: 'border',
  rounded: 'md',
  shadow: 'lg',
  p: '1.5',
  zIndex: '20',
  outline: '0'
})

export const menuItem = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  minH: '9',
  px: '3',
  py: '2',
  rounded: 'md',
  textStyle: 'sm',
  color: 'fg.muted',
  textDecoration: 'none',
  cursor: 'pointer',
  transitionProperty: 'color, background-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', bg: 'bg.subtle' },
  _highlighted: { color: 'fg', bg: 'bg.muted' }
})
