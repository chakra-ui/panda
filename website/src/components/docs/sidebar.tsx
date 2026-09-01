'use client'

import { Badge } from '@/components/ui/badge'
import type { IconType } from 'react-icons'
import {
  LuBlocks,
  LuBookOpen,
  LuBot,
  LuCircleHelp,
  LuCog,
  LuDownload,
  LuFolderTree,
  LuLayers,
  LuLayoutGrid,
  LuPackage,
  LuPalette,
  LuRocket,
  LuShuffle,
  LuSlidersHorizontal,
  LuLightbulb,
  LuTerminal,
  LuType,
  LuWrench
} from 'react-icons/lu'
import { docsTabs } from '@/docs.config'
import { useScrollActiveIntoView } from '@/lib/use-scroll-active-into-view'
import { Stack } from '@/styled-system/jsx'
import { docNav } from '@/styled-system/recipes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuArrowUpRight } from 'react-icons/lu'

/** Group titles come from docs.config; anything unmapped falls back to a folder. */
const GROUP_ICONS: Record<string, IconType> = {
  'Get Started': LuRocket,
  Installation: LuDownload,
  'Core Concepts': LuLightbulb,
  'Styling APIs': LuLayers,
  'How It Works': LuCog,
  Migration: LuShuffle,
  Recipes: LuLayers,
  'JSX Recipes': LuLayoutGrid,
  Guides: LuBookOpen,
  Tokens: LuPalette,
  'Composite Styles': LuType,
  Themes: LuPalette,
  Studio: LuLayoutGrid,
  'Component Library': LuBlocks,
  'Design System Preset': LuPackage,
  Customization: LuSlidersHorizontal,
  'Distribution & Scale': LuPackage,
  Tooling: LuWrench,
  Frameworks: LuBlocks,
  'AI for Agents': LuBot,
  Help: LuCircleHelp,
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
  // Long tabs scroll past the fold, so arriving on a deep page would otherwise
  // show no highlight at all. Instant, since the marker only moves on navigation.
  const navRef = useScrollActiveIntoView<HTMLDivElement>({
    activeKey: pathname,
    behavior: 'auto'
  })
  // pathname is `/docs/{tabKey}/...`; currentSlug (when passed) is `{tabKey}/...`
  const tabKey =
    pathname?.split('/')[2] || currentSlug?.split('/')[0] || fallbackTab
  const tab = docsTabs.find(t => t.key === tabKey)

  if (!tab) return null

  const isActive = (pageUrl: string) =>
    pathname === `/docs/${tabKey}/${pageUrl}` ||
    currentSlug === `${tabKey}/${pageUrl}`

  const isItemActive = (
    item: NonNullable<(typeof tab.items)[number]['items']>[number]
  ) => !!item.url && isActive(item.url)

  const classes = docNav({ kind: 'sidebar' })

  return (
    <Stack ref={navRef} as="nav" aria-label={`${tab.title} pages`} gap="7">
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

                const current = isItemActive(item)

                return (
                  <Link
                    key={item.url}
                    href={`/docs/${tabKey}/${item.url}`}
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
  )
}
