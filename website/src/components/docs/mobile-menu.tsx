'use client'

import { Sidebar } from '@/components/docs/sidebar'
import { TAB_ICONS } from '@/components/docs/tab-bar'
import { communityLinks, docsTabs } from '@/docs.config'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import Link from 'next/link'
import { LuArrowUpRight } from 'react-icons/lu'

const SITE_LINKS = [
  { title: 'Docs', href: '/docs' },
  { title: 'Guides', href: '/guides' },
  { title: 'Reference', href: '/docs/reference/cli' },
  { title: 'Blog', href: '/blog' },
  { title: 'Showcase', href: '/showcase' },
  { title: 'Install', href: '/install' }
]

const sectionLabel = css({
  textStyle: 'eyebrow',
  color: 'fg.subtle',
  mb: '3'
})

const rowLink = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minH: '11',
  px: '3',
  rounded: 'md',
  textStyle: 'md',
  fontWeight: 'medium',
  color: 'fg.muted',
  textDecoration: 'none',
  transitionProperty: 'color, background-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', bg: 'bg.subtle' },
  '&[data-current]': { color: 'fg', bg: 'accent.wash' }
})

const tabPill = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minH: '9',
  px: '3',
  rounded: 'full',
  textStyle: 'sm',
  fontWeight: 'medium',
  borderWidth: '1px',
  borderColor: 'border',
  color: 'fg.muted',
  textDecoration: 'none',
  transitionProperty: 'color, background-color, border-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', borderColor: 'fg.subtle' },
  '&[data-current]': {
    color: 'fg',
    bg: 'accent.wash',
    borderColor: 'accent.emphasis'
  }
})

interface Props {
  pathname: string | null
}

export const MobileMenu = ({ pathname }: Props) => {
  const inDocs = !!pathname?.startsWith('/docs')
  const activeTab = pathname?.split('/')[2]

  return (
    <Stack gap="8" pt="4" pb="10">
      <nav aria-label="Site">
        <Box className={sectionLabel}>Browse</Box>
        <Stack gap="0.5">
          {SITE_LINKS.map(link => {
            const current =
              link.href === '/docs'
                ? pathname === '/docs'
                : pathname?.startsWith(link.href)
            return (
              <Link
                key={link.title}
                href={link.href}
                data-current={current || undefined}
                aria-current={current ? 'page' : undefined}
                className={rowLink}
              >
                {link.title}
              </Link>
            )
          })}
        </Stack>
      </nav>

      {inDocs && (
        <nav aria-label="Docs sections">
          <Box className={sectionLabel}>Sections</Box>
          <Box display="flex" flexWrap="wrap" gap="2">
            {docsTabs.map(tab => {
              const Icon = TAB_ICONS[tab.key]
              const current = tab.key === activeTab
              return (
                <Link
                  key={tab.key}
                  href={`/docs/${tab.key}`}
                  data-current={current || undefined}
                  aria-current={current ? 'page' : undefined}
                  className={tabPill}
                >
                  {Icon && <Icon size={14} aria-hidden />}
                  {tab.title}
                </Link>
              )
            })}
          </Box>
        </nav>
      )}

      {inDocs && activeTab && (
        <Box borderTopWidth="1px" borderColor="border" pt="6">
          <Sidebar tabKey={activeTab} />
        </Box>
      )}

      <Box borderTopWidth="1px" borderColor="border" pt="6">
        <Box className={sectionLabel}>Community</Box>
        <Stack gap="0.5">
          {communityLinks.map(link =>
            link.external ? (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={rowLink}
              >
                {link.title}
                <LuArrowUpRight size={15} />
              </a>
            ) : (
              <Link key={link.title} href={link.href ?? '#'} className={rowLink}>
                {link.title}
              </Link>
            )
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
