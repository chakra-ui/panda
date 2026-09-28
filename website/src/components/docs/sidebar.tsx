'use client'

import { Badge } from '@/components/ui/badge'
import type { IconType } from 'react-icons'
import {
  LuBlocks,
  LuBookOpen,
  LuBot,
  LuDownload,
  LuFolderTree,
  LuLayers,
  LuLayoutGrid,
  LuPackage,
  LuPalette,
  LuRocket,
  LuShuffle,
  LuSlidersHorizontal,
  LuPaintbrush,
  LuCode,
  LuSparkles,
  LuTerminal,
  LuType,
  LuWrench
} from 'react-icons/lu'
import { CommunityMenu, SponsorLink } from '@/components/docs/community-links'
import { docsTabs, type TabItem } from '@/docs.config'
import { useScrollActiveIntoView } from '@/lib/use-scroll-active-into-view'
import { css } from '@/styled-system/css'
import { Stack } from '@/styled-system/jsx'
import { docNav } from '@/styled-system/recipes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LuArrowUpRight, LuChevronDown } from 'react-icons/lu'

const TAB_ICONS: Record<string, IconType> = {
  'get-started': LuRocket,
  styling: LuPaintbrush,
  recipes: LuLayers,
  theming: LuPalette,
  'design-systems': LuBlocks,
  reference: LuBookOpen
}

/** Group titles come from docs.config; anything unmapped falls back to a folder. */
const GROUP_ICONS: Record<string, IconType> = {
  'Get Started': LuRocket,
  Installation: LuDownload,
  'Write styles': LuPaintbrush,
  JSX: LuCode,
  'Build & output': LuFolderTree,
  Advanced: LuSparkles,
  Migration: LuShuffle,
  'Write recipes': LuLayers,
  Variants: LuSlidersHorizontal,
  'JSX Usage': LuLayoutGrid,
  Tokens: LuPalette,
  'Composite Styles': LuType,
  Themes: LuPalette,
  Studio: LuLayoutGrid,
  'Component Library': LuBlocks,
  'Design System Preset': LuPackage,
  Customization: LuSlidersHorizontal,
  'Distribution & Scale': LuPackage,
  'Styled System': LuPackage,
  Tooling: LuWrench,
  Frameworks: LuBlocks,
  'Using AI': LuBot,
  'CLI & Config': LuTerminal,
  'Utility Reference': LuBookOpen
}

interface Props {
  /** `{tabKey}/{page}`, e.g. `styling/getting-started`. Matches the docs page route's `slug`. */
  slug?: string
  /** Used when the route has no tab segment of its own, e.g. the `/docs` welcome page. */
  tabKey?: string
}

export function Sidebar({ slug: currentSlug, tabKey: fallbackTab }: Props) {
  const pathname = usePathname()
  // Instant: it only moves on navigation, where easing reads as a glitch.
  const navRef = useScrollActiveIntoView<HTMLDivElement>({
    activeKey: pathname,
    behavior: 'auto'
  })
  const activeKey =
    pathname?.split('/')[2] || currentSlug?.split('/')[0] || fallbackTab
  const [openKeys, setOpenKeys] = useState<string[]>(
    activeKey ? [activeKey] : []
  )

  useEffect(() => {
    if (!activeKey) return
    setOpenKeys(keys =>
      keys.includes(activeKey) ? keys : [...keys, activeKey]
    )
  }, [activeKey])

  const toggle = (key: string) =>
    setOpenKeys(keys =>
      keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]
    )

  return (
    <Stack ref={navRef} as="nav" aria-label="Docs" gap="1">
      {docsTabs.map(tab => (
        <SidebarCategory
          key={tab.key}
          tab={tab}
          open={openKeys.includes(tab.key)}
          onToggle={() => toggle(tab.key)}
          pathname={pathname}
          currentSlug={currentSlug}
        />
      ))}
      <Stack
        gap="0"
        mt="6"
        pt="4"
        borderTopWidth="1px"
        borderColor="border"
        alignItems="flex-start"
      >
        <CommunityMenu />
        <SponsorLink />
      </Stack>
    </Stack>
  )
}

interface SidebarCategoryProps {
  tab: TabItem
  open: boolean
  onToggle: () => void
  pathname: string | null
  currentSlug?: string
}

function SidebarCategory(props: SidebarCategoryProps) {
  const { tab, open, onToggle, pathname, currentSlug } = props
  const Icon = TAB_ICONS[tab.key] ?? LuFolderTree
  const panelId = `sidebar-${tab.key}`

  const isActive = (pageUrl: string) =>
    pathname === `/docs/${tab.key}/${pageUrl}` ||
    currentSlug === `${tab.key}/${pageUrl}`

  const classes = docNav({ kind: 'sidebar' })

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={categoryTrigger}
      >
        <Icon size={18} aria-hidden />
        <span>{tab.title}</span>
        <LuChevronDown
          size={14}
          aria-hidden
          className={css({
            ml: 'auto',
            transition: 'transform 150ms',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)'
          })}
        />
      </button>

      {open && (
        <Stack id={panelId} gap="7" pt="4" pb="6" ps="4">
          {tab.items.map(group => (
            <div key={group.title}>
              <div className={classes.label}>
                {(() => {
                  const GroupIcon = GROUP_ICONS[group.title] ?? LuFolderTree
                  return <GroupIcon size={16} aria-hidden />
                })()}
                <span>{group.title}</span>
                {group.tag && <Badge variant="solid">{group.tag}</Badge>}
              </div>

              {group.items && (
                <div className={classes.list}>
                  {group.items.map(item => {
                    if (item.external) {
                      return (
                        <a
                          key={item.title}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={classes.link}
                        >
                          {item.title}
                          <LuArrowUpRight />
                        </a>
                      )
                    }

                    if (item.href) {
                      const current = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-current={current || undefined}
                          aria-current={current ? 'page' : undefined}
                          className={classes.link}
                        >
                          <span>{item.title}</span>
                        </Link>
                      )
                    }

                    if (!item.url) return null

                    const current = isActive(item.url)

                    return (
                      <Link
                        key={item.url}
                        href={`/docs/${tab.key}/${item.url}`}
                        data-current={current || undefined}
                        aria-current={current ? 'page' : undefined}
                        className={classes.link}
                      >
                        <span>{item.title}</span>
                        {item.tag && <Badge variant="solid">{item.tag}</Badge>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </Stack>
      )}
    </div>
  )
}

const categoryTrigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  w: 'full',
  px: '2',
  py: '2',
  rounded: 'md',
  textStyle: 'md',
  fontWeight: 'semibold',
  color: 'fg',
  cursor: 'pointer',
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  _hover: { bg: 'bg.subtle' },
  '& svg': { color: 'fg.subtle', flexShrink: 0 }
})
