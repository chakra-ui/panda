'use client'

import { Badge } from '@/components/ui/badge'
import { docsTabs } from '@/docs.config'
import { ChevronDownIcon, ChevronRightIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box, HStack, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LuArrowUpRight } from 'react-icons/lu'

interface Props {
  /** `{tabKey}/{page}`, e.g. `styling/why-panda`. Matches the docs page route's `slug`. */
  slug?: string
}

const linkStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '4',
  py: '1.5',
  rounded: 'md',
  textStyle: 'sm',
  color: 'fg.muted',
  bg: 'transparent',
  fontWeight: 'normal',
  transitionProperty: 'background, color',
  transitionDuration: '200ms',
  _hover: { bg: 'bg.subtle', color: 'fg' },
  _current: {
    color: 'fg',
    bg: 'accent.subtle',
    fontWeight: 'semibold'
  }
})

export function Sidebar({ slug: currentSlug }: Props) {
  const pathname = usePathname()
  // pathname is `/docs/{tabKey}/...`; currentSlug (when passed) is `{tabKey}/...`
  const tabKey = pathname?.split('/')[2] || currentSlug?.split('/')[0]
  const tab = docsTabs.find(t => t.key === tabKey)

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  if (!tab) return null

  const isActive = (pageUrl: string) =>
    pathname === `/docs/${tabKey}/${pageUrl}` ||
    currentSlug === `${tabKey}/${pageUrl}`

  const isGroupActive = (groupItems: typeof tab.items[number]['items']) =>
    groupItems?.some(item => item.url && isActive(item.url)) || false

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <Stack as="nav" gap="1">
      {tab.items.map(group => {
        const isExpanded =
          expandedGroups.has(group.title) || isGroupActive(group.items)

        return (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                w: 'full',
                px: '3',
                py: '2',
                rounded: 'md',
                fontWeight: 'semibold',
                fontSize: 'sm',
                color: 'fg',
                transitionProperty: 'background',
                transitionDuration: '200ms',
                _hover: { bg: 'bg.subtle' },
                cursor: 'pointer'
              })}
            >
              <HStack>
                <span>{group.title}</span>
                {group.tag && <Badge variant="solid">{group.tag}</Badge>}
              </HStack>
              {group.items && (
                <Box
                  as={isExpanded ? ChevronDownIcon : ChevronRightIcon}
                  w="4"
                  h="4"
                  color="fg.muted"
                />
              )}
            </button>

            {isExpanded && group.items && (
              <Stack gap="0.5" mt="1">
                {group.items.map(item => {
                  if (item.external) {
                    return (
                      <a
                        key={item.title}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkStyles}
                      >
                        {item.title}
                        <LuArrowUpRight />
                      </a>
                    )
                  }

                  if (!item.url) return null

                  return (
                    <Link
                      key={item.url}
                      href={`/docs/${tabKey}/${item.url}`}
                      data-current={isActive(item.url) || undefined}
                      className={linkStyles}
                    >
                      <span>{item.title}</span>
                      {item.tag && <Badge variant="solid">{item.tag}</Badge>}
                    </Link>
                  )
                })}
              </Stack>
            )}
          </div>
        )
      })}
    </Stack>
  )
}
