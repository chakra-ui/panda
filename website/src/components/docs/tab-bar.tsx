'use client'

import { docsTabs, type TabItem } from '@/docs.config'
import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The persistent tab bar for the docs shell. Styling / Theming / Design Systems
 * on the left (build intents), References on the right (cross-cutting lookup),
 * plus a plain Blog link. Active tab is derived from the URL's first `/docs/:key`
 * segment, so it stays in sync with server-rendered navigation with no extra state.
 */
export function TabBar() {
  const pathname = usePathname()
  const activeKey = pathname?.split('/')[2]

  const left = docsTabs.filter(tab => tab.side === 'left')
  const right = docsTabs.filter(tab => tab.side === 'right')

  return (
    <HStack
      as="nav"
      aria-label="Docs sections"
      gap="6"
      px={{ base: '4', lg: '10' }}
      borderBottomWidth="1px"
      borderColor="border"
      overflowX="auto"
      className="scroll-area"
    >
      <HStack gap="6" flexShrink="0">
        {left.map(tab => (
          <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
        ))}
      </HStack>
      <HStack gap="6" ml="auto" flexShrink="0">
        {right.map(tab => (
          <TabLink key={tab.key} tab={tab} active={tab.key === activeKey} />
        ))}
        <a
          href="/blog"
          className={css({
            textStyle: 'sm',
            color: 'fg.muted',
            py: '3',
            whiteSpace: 'nowrap',
            _hover: { color: 'fg' }
          })}
        >
          Blog
        </a>
      </HStack>
    </HStack>
  )
}

interface TabLinkProps {
  tab: TabItem
  active: boolean
}

function TabLink({ tab, active }: TabLinkProps) {
  return (
    <Link
      href={`/docs/${tab.key}`}
      aria-current={active || undefined}
      className={css({
        textStyle: 'sm',
        fontWeight: 'medium',
        py: '3',
        whiteSpace: 'nowrap',
        borderBottomWidth: '2px',
        borderColor: active ? 'accent' : 'transparent',
        color: active ? 'fg' : 'fg.muted',
        transitionProperty: 'color, border-color',
        transitionDuration: '200ms',
        _hover: { color: 'fg' }
      })}
    >
      {tab.title}
    </Link>
  )
}
