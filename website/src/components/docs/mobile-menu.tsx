'use client'

import { docsConfig } from '@/docs.config'
import { Icon } from '@/theme/icons'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import { ThemeSegmented } from '@/components/docs/theme-segmented'
import Link from 'next/link'
import { LuArrowUpRight, LuGithub, LuMessageCircle, LuTwitter } from 'react-icons/lu'

const SITE_LINKS = [
  { title: 'Home', href: '/' },
  { title: 'Docs', href: '/docs' },
  { title: 'Blog', href: '/blog' },
  { title: 'Showcase', href: '/showcase' }
]

const primaryLink = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4',
  py: '4',
  fontSize: '1.75rem',
  fontWeight: 'bold',
  letterSpacing: 'tight',
  lineHeight: '1.2',
  color: 'fg',
  textDecoration: 'none',
  borderBottomWidth: '1px',
  borderColor: 'border',
  '& svg': { color: 'fg.subtle', flexShrink: 0 },
  '&[data-current]': {
    color: 'accent.emphasis',
    '& svg': { color: 'accent.emphasis' }
  }
})

const socialCircle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  w: '11',
  h: '11',
  rounded: 'full',
  borderWidth: '1px',
  borderColor: 'border',
  color: 'fg.muted',
  _hover: { color: 'fg', borderColor: 'fg.subtle' }
})

export const MobileMenuLogo = () => (
  <Link
    href="/"
    aria-label="Panda CSS home"
    className={css({
      display: 'flex',
      alignItems: 'center',
      '& svg': { height: '1.6rem', width: 'auto' }
    })}
  >
    <Icon icon="LogoWithText" />
  </Link>
)

interface Props {
  pathname: string | null
}

export const MobileMenu = ({ pathname }: Props) => {
  const socials = [
    { icon: <LuGithub />, href: docsConfig.docsRepositoryBase, label: 'GitHub' },
    { icon: <LuMessageCircle />, href: docsConfig.discordUrl, label: 'Discord' },
    { icon: <LuTwitter />, href: docsConfig.twitterUrl, label: 'X' }
  ]

  return (
    <Stack gap="8" pt="2" pb="10">
      <nav aria-label="Site">
        {SITE_LINKS.map(link => {
          const current =
            link.href === '/'
              ? pathname === '/'
              : link.href === '/docs'
                ? pathname === '/docs'
                : pathname?.startsWith(link.href)
          return (
            <Link
              key={link.title}
              href={link.href}
              data-current={current || undefined}
              aria-current={current ? 'page' : undefined}
              className={primaryLink}
            >
              {link.title}
              <LuArrowUpRight size={20} aria-hidden />
            </Link>
          )
        })}
      </nav>

      <Stack gap="3">
        <Link
          href="/docs/get-started/cli"
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minH: '14',
            rounded: 'lg',
            bg: 'accent',
            color: 'black',
            fontSize: 'lg',
            fontWeight: 'bold',
            textDecoration: 'none'
          })}
        >
          Install Panda
        </Link>

        <a
          href="https://play.panda-css.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2',
            minH: '14',
            rounded: 'lg',
            borderWidth: '1px',
            borderColor: 'border',
            color: 'fg',
            fontSize: 'lg',
            fontWeight: 'semibold',
            textDecoration: 'none',
            transitionProperty: 'background-color, border-color',
            transitionDuration: '150ms',
            _hover: { bg: 'bg.subtle', borderColor: 'fg.subtle' }
          })}
        >
          Playground
          <LuArrowUpRight size={18} aria-hidden />
        </a>
      </Stack>

      <Stack gap="5" borderTopWidth="1px" borderColor="border" pt="6">
        <ThemeSegmented />

        <Box display="flex" alignItems="center" gap="3">
          {socials.map(social => (
          <a
            key={social.label}
            href={social.href}
            aria-label={social.label}
            target="_blank"
            rel="noopener noreferrer"
            className={socialCircle}
          >
            {social.icon}
          </a>
          ))}
        </Box>
      </Stack>
    </Stack>
  )
}
