'use client'

import { Badge } from '@/components/ui/badge'
import { docsTabs } from '@/docs.config'
import { css } from '@/styled-system/css'
import { HStack, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuArrowUpRight } from 'react-icons/lu'

interface Props {
  /** `{tabKey}/{page}`, e.g. `styling/getting-started`. Matches the docs page route's `slug`. */
  slug?: string
}

const linkStyles = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minH: '8',
  ml: '-1px',
  ps: '4',
  pe: '3',
  py: '1.5',
  roundedEnd: 'md',
  textStyle: 'sm',
  color: 'fg.muted',
  bg: 'transparent',
  fontWeight: 'medium',
  transitionProperty: 'background-color, color',
  transitionDuration: '150ms',
  _before: {
    content: '""',
    position: 'absolute',
    insetY: '0',
    insetStart: '0',
    width: '2px',
    bg: 'transparent',
    transitionProperty: 'background-color',
    transitionDuration: '150ms'
  },
  _hover: { bg: 'bg.subtle', color: 'fg' },
  _current: {
    color: 'fg',
    bg: 'accent.subtle',
    _before: { bg: 'accent.emphasis' }
  }
})

export function Sidebar({ slug: currentSlug }: Props) {
  const pathname = usePathname()
  // pathname is `/docs/{tabKey}/...`; currentSlug (when passed) is `{tabKey}/...`
  const tabKey = pathname?.split('/')[2] || currentSlug?.split('/')[0]
  const tab = docsTabs.find(t => t.key === tabKey)

  if (!tab) return null

  const isActive = (pageUrl: string) =>
    pathname === `/docs/${tabKey}/${pageUrl}` ||
    currentSlug === `${tabKey}/${pageUrl}`

  const isItemActive = (
    item: NonNullable<(typeof tab.items)[number]['items']>[number]
  ) => !!item.url && isActive(item.url)

  return (
    <Stack as="nav" aria-label={`${tab.title} pages`} gap="1">
      {tab.items.map(group => (
        <div key={group.title}>
          <HStack
            px="3"
            py="2"
            fontWeight="semibold"
            fontSize="sm"
            color="fg"
          >
            <span>{group.title}</span>
            {group.tag && <Badge variant="solid">{group.tag}</Badge>}
          </HStack>

          {group.items && (
            <Stack
              gap="0.5"
              mt="1"
              borderInlineStartWidth="1px"
              borderColor="border"
            >
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

                const current = isItemActive(item)

                return (
                  <Link
                    key={item.url}
                    href={`/docs/${tabKey}/${item.url}`}
                    data-current={current || undefined}
                    aria-current={current ? 'page' : undefined}
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
      ))}
    </Stack>
  )
}
