'use client'

import {
  communityLinks,
  defaultTabKey,
  docsTabs,
  tabLandingHref,
  type TabItem
} from '@/docs.config'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from '@ark-ui/react/menu'
import { Portal } from '@ark-ui/react/portal'
import {
  LuArrowUpRight,
  LuBlocks,
  LuBookOpen,
  LuChevronDown,
  LuHeart,
  LuLayers,
  LuPaintbrush,
  LuPalette,
  LuRocket,
  LuUsers
} from 'react-icons/lu'
import type { IconType } from 'react-icons'

export const TAB_ICONS: Record<string, IconType> = {
  'get-started': LuRocket,
  styling: LuPaintbrush,
  recipes: LuLayers,
  theming: LuPalette,
  'design-systems': LuBlocks,
  reference: LuBookOpen
}

/**
 * Takes the same responsive `px` as the navbar and sidebar rather than a `maxW`
 * column, which would only line up with the sidebar until it hits that maxW.
 */
export function TabBar() {
  const pathname = usePathname()
  // `/docs` has no tab segment, and is where Get Started lands.
  const activeKey = pathname?.split('/')[2] || defaultTabKey

  const left = docsTabs.filter(tab => tab.side === 'left')
  const right = docsTabs.filter(tab => tab.side === 'right')

  return (
    <Box
      as="nav"
      aria-label="Docs sections"
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg"
    >
      <HStack
        gap="1"
        px={{ base: '4', md: '6' }}
        overflowX="auto"
        overflowY="hidden"
        className="scroll-area"
        alignItems="stretch"
      >
        <HStack gap="1" flexShrink="0" alignItems="stretch">
          {left.map(tab => (
            <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
          ))}
        </HStack>
        <HStack gap="1" ml="auto" alignItems="stretch" flexShrink="0">
          {right.map(tab => (
            <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
          ))}
          <CommunityMenu />
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
        </HStack>
      </HStack>
    </Box>
  )
}

/**
 * Portaled out of the row: `overflow-x: auto` there forces `overflow-y` to clip
 * as well, which would silently cut the panel off.
 */
function CommunityMenu() {
  return (
    <Menu.Root lazyMount positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger className={communityTrigger}>
        <LuUsers size={16} />
        Community
        <LuChevronDown size={14} />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className={communityContent}>
            {communityLinks.map(link => (
              <Menu.Item
                key={link.title}
                value={link.title}
                asChild
                className={communityItem}
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

const communityContent = css({
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

const communityItem = css({
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

interface TabLinkProps {
  tab: TabItem
  active: boolean
}

function TabLink({ tab, active }: TabLinkProps) {
  const Icon = TAB_ICONS[tab.key]

  return (
    <Link
      href={tabLandingHref(tab.key)}
      aria-current={active ? 'page' : undefined}
      className={css({
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '2',
        textStyle: 'sm',
        fontWeight: 'semibold',
        px: '3',
        py: '3',
        rounded: 'md',
        whiteSpace: 'nowrap',
        color: active ? 'fg' : 'fg.muted',
        transitionProperty: 'color, background',
        transitionDuration: '200ms',
        _hover: {
          color: 'fg',
          bg: 'bg.subtle',
          _after: { bg: active ? 'accent' : 'fg.muted' }
        },
        _after: {
          content: '""',
          position: 'absolute',
          left: '3',
          right: '3',
          // Flush inside the row: 1px of spill was enough to add a scrollbar.
          bottom: '0',
          height: '2px',
          bg: active ? 'accent' : 'transparent',
          transitionProperty: 'background',
          transitionDuration: '200ms'
        }
      })}
    >
      {Icon && <Icon size={16} />}
      {tab.title}
    </Link>
  )
}
