'use client'

import { Badge } from '@/components/ui/badge'
import type { IconType } from 'react-icons'
import {
  LuBlocks,
  LuBookOpen,
  LuBot,
  LuCircleHelp,
  LuCog,
  LuFolderTree,
  LuLayers,
  LuLayoutGrid,
  LuPackage,
  LuPalette,
  LuRocket,
  LuShuffle,
  LuSlidersHorizontal,
  LuSparkles,
  LuTerminal,
  LuType,
  LuWrench
} from 'react-icons/lu'
import { docsTabs } from '@/docs.config'
import { Stack } from '@/styled-system/jsx'
import { docNav } from '@/styled-system/recipes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuArrowUpRight } from 'react-icons/lu'

/** Group titles come from docs.config; anything unmapped falls back to a folder. */
const GROUP_ICONS: Record<string, IconType> = {
  'Get Started': LuRocket,
  'Core Concepts': LuSparkles,
  'Styling APIs': LuLayers,
  Migration: LuShuffle,
  Recipes: LuLayers,
  Composition: LuLayoutGrid,
  Tokens: LuPalette,
  'Composite Styles': LuType,
  Themes: LuPalette,
  'Component Library': LuBlocks,
  'Design System (preset)': LuPackage,
  Customization: LuSlidersHorizontal,
  'Distribution & Scale': LuPackage,
  'How it works': LuCog,
  'Build Integrations': LuTerminal,
  'Framework Guides': LuBlocks,
  'Lint & Edit': LuWrench,
  'AI for Agents': LuBot,
  Inspect: LuLayoutGrid,
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
    <Stack as="nav" aria-label={`${tab.title} pages`} gap="1">
      {tab.items.map(group => (
        <div key={group.title}>
          <div className={classes.label}>
            {(() => {
              const GroupIcon = GROUP_ICONS[group.title] ?? LuFolderTree
              return <GroupIcon size={15} aria-hidden />
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
