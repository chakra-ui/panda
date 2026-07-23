'use client'

import { docsTabs, type TabItem } from '@/docs.config'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuBlocks, LuBookOpen, LuPaintbrush, LuPalette } from 'react-icons/lu'
import type { IconType } from 'react-icons'

export const TAB_ICONS: Record<string, IconType> = {
  styling: LuPaintbrush,
  theming: LuPalette,
  'design-systems': LuBlocks,
  reference: LuBookOpen
}

/**
 * The persistent tab bar for the docs shell. Styling / Theming / Design Systems
 * on the left (build intents), References on the right (cross-cutting lookup),
 * plus a plain Blog link. Active tab is derived from the URL's first `/docs/:key`
 * segment, so it stays in sync with server-rendered navigation with no extra state.
 *
 * Hugs the real page edge with a small fixed `px`, same as the sidebar below it,
 * instead of sitting inside a `maxW` centered column. A centered shell only
 * matches the sidebar's position up to that maxW; past it, the two drift apart.
 *
 * Every tab shows its own underline (`border` at rest, `accent` when active,
 * `fg.muted` on hover), stretched to the row's full height so it always sits at
 * the same baseline. Hover also adds a subtle background pill, matching the
 * sidebar's own group-header hover treatment.
 */
export function TabBar() {
  const pathname = usePathname()
  const activeKey = pathname?.split('/')[2]

  const left = docsTabs.filter(tab => tab.side === 'left')
  const right = docsTabs.filter(tab => tab.side === 'right')

  return (
    <Box as="nav" aria-label="Docs sections" borderBottomWidth="1px" borderColor="border">
      <HStack gap="1" px="6" overflowX="auto" className="scroll-area" alignItems="stretch">
        <HStack gap="1" flexShrink="0" alignItems="stretch">
          {left.map(tab => (
            <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
          ))}
        </HStack>
        <HStack gap="1" ml="auto" alignItems="stretch" flexShrink="0">
          {right.map(tab => (
            <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
          ))}
          <a
            href="/blog"
            className={css({
              display: 'flex',
              alignItems: 'center',
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
            Blog
          </a>
        </HStack>
      </HStack>
    </Box>
  )
}

interface TabLinkProps {
  tab: TabItem
  active: boolean
}

function TabLink({ tab, active }: TabLinkProps) {
  const Icon = TAB_ICONS[tab.key]

  return (
    <Link
      href={`/docs/${tab.key}`}
      aria-current={active || undefined}
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
          bottom: '-1px',
          height: '2px',
          bg: active ? 'accent' : 'border',
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
