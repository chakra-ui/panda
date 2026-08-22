'use client'

import { Badge } from '@/components/ui/badge'
import { docsTabs, installationGuideUrls } from '@/docs.config'
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

  if (!tab) return null

  const isActive = (pageUrl: string) =>
    pathname === `/docs/${tabKey}/${pageUrl}` ||
    currentSlug === `${tabKey}/${pageUrl}`

  // Framework/CLI/PostCSS/Storybook guides live only behind the Installation
  // page's tabs, not as their own sidebar items, but the sidebar should still
  // point at "Installation" while viewing one.
  const currentPageUrl = pathname?.split('/')[3] || currentSlug?.split('/')[1]
  const isOnInstallationGuide =
    !!currentPageUrl && installationGuideUrls.includes(currentPageUrl)

  const isItemActive = (item: NonNullable<typeof tab.items[number]['items']>[number]) =>
    (item.url && isActive(item.url)) ||
    (item.url === 'installation' && isOnInstallationGuide)

  return (
    <Stack as="nav" gap="1">
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
                    data-current={isItemActive(item) || undefined}
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
