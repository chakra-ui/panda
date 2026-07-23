'use client'

import { Badge } from '@/components/ui/badge'
import { docsTabs } from '@/docs.config'
import { css } from '@/styled-system/css'
import { HStack, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LuArrowUpRight } from 'react-icons/lu'

interface Props {
  /** `{tabKey}/{page}`, e.g. `styling/why-panda`. Matches the docs page route's `slug`. */
  slug?: string
}

const linkStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  px: '3',
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

  if (!tab) return null

  const isActive = (pageUrl: string) =>
    pathname === `/docs/${tabKey}/${pageUrl}` ||
    currentSlug === `${tabKey}/${pageUrl}`

  return (
    <Stack as="nav" gap="5">
      {tab.items.map(group => (
        <div key={group.title}>
          <HStack px="3" py="1" gap="2">
            <span
              className={css({
                textStyle: 'xs',
                fontWeight: 'semibold',
                color: 'fg.muted',
                textTransform: 'uppercase',
                letterSpacing: 'wide'
              })}
            >
              {group.title}
            </span>
            {group.tag && <Badge variant="solid">{group.tag}</Badge>}
          </HStack>

          <Stack gap="0.5" mt="1">
            {group.items?.map(item => {
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
        </div>
      ))}
    </Stack>
  )
}
