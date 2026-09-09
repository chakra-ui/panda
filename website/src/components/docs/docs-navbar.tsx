'use client'

import { CourseBanner } from '@/components/course-banner'
import { CommandMenu } from '@/components/docs/command-menu'
import { SearchButton } from '@/components/docs/search'
import { Anchor } from '@/components/ui/anchor'
import { docsConfig } from '@/docs.config'
import { GithubIcon, MenuIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import { Icon } from '@/theme/icons'
import { MobileMenu, MobileMenuLogo } from '@/components/docs/mobile-menu'
import { MobileNavDrawer } from '@/mdx/navbar'
import { ThemeSwitch } from '@/mdx/theme-switch'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Docs-only; `mdx/navbar.tsx` still serves the marketing pages. Fixed rather
 * than sticky: the layout's TabBar offset and `main` padding are computed
 * against `--navbar-height` assuming this bar is out of flow.
 */
const siteLinks = [
  {
    title: 'Docs',
    href: '/docs',
    match: (p: string) => p.startsWith('/docs')
  },
  { title: 'Blog', href: '/blog', match: (p: string) => p.startsWith('/blog') },
  {
    title: 'Showcase',
    href: '/showcase',
    match: (p: string) => p.startsWith('/showcase')
  }
]

export function DocsNavbar() {
  const pathname = usePathname()

  return (
    <Box as="header" position="fixed" top="0" insetX="0" zIndex="20" bg="bg">
      <CourseBanner />

      <HStack
        h="var(--navbar-height, 4rem)"
        px={{ base: '4', md: '6' }}
        gap={{ base: '1', md: '4' }}
        // Below `md` the bar is a row with the search collapsed to an icon on
        // the right; above it, `1fr auto 1fr` centres the search whatever the
        // two sides happen to contain.
        display={{ base: 'flex', md: 'grid' }}
        gridTemplateColumns={{ md: '1fr auto 1fr' }}
        alignItems="center"
      >
        <HStack gap={{ base: '1', md: '4' }} minW="0" flexShrink="0">
          <Anchor
            href="/"
            aria-label="Panda CSS home"
            className={css({
              flexShrink: '0',
              display: 'flex',
              _hover: { opacity: 0.75 }
            })}
          >
            <Icon icon="LogoWithText" />
          </Anchor>

          <HStack gap="1" flexShrink="0" display={{ base: 'none', lg: 'flex' }}>
            {siteLinks.map(link => {
              const active = link.match(pathname ?? '')
              return (
                <Link
                  key={link.title}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={css({
                    textStyle: 'sm',
                    fontWeight: 'medium',
                    px: '3',
                    py: '1.5',
                    rounded: 'md',
                    whiteSpace: 'nowrap',
                    color: active ? 'fg' : 'fg.muted',
                    bg: active ? 'bg.muted' : 'transparent',
                    transitionProperty: 'color, background-color',
                    transitionDuration: '150ms',
                    _hover: { color: 'fg', bg: 'bg.subtle' }
                  })}
                >
                  {link.title}
                </Link>
              )
            })}
          </HStack>
        </HStack>

        <Box
          flex={{ base: '0 0 auto', md: 'none' }}
          ml={{ base: 'auto', md: '0' }}
          display="flex"
          justifyContent="center"
          w={{ md: '28rem' }}
          maxW={{ base: 'none', md: '32rem' }}
        >
          <CommandMenu
            trigger={
              <SearchButton
                containerClassName={css({
                  flex: '1',
                  width: 'full',
                  maxW: '28rem'
                })}
                className={css({ width: 'full' })}
              />
            }
            mediaQuery="max-width: 640px"
          />
        </Box>

        <HStack
          gap={{ base: '0', md: '2' }}
          minW="0"
          flexShrink="0"
          justifySelf="end"
        >
          <Anchor
            href="https://play.panda-css.com/"
            newWindow
            className={css({
              display: { base: 'none', lg: 'flex' },
              alignItems: 'center',
              px: '3',
              py: '2',
              rounded: 'md',
              bg: 'bg.inverted',
              color: 'white',
              textStyle: 'sm',
              fontWeight: 'semibold',
              whiteSpace: 'nowrap',
              transitionProperty: 'opacity',
              transitionDuration: '150ms',
              _hover: { opacity: 0.8 }
            })}
          >
            Playground
          </Anchor>

          {docsConfig.docsRepositoryBase ? (
            <Anchor
              href={docsConfig.docsRepositoryBase}
              newWindow
              className={css({
                display: { base: 'none', lg: 'flex' },
                p: '2',
                color: 'currentColor',
                rounded: 'md',
                _hover: { bg: 'bg.subtle' },
                _icon: { width: '5' }
              })}
            >
              <GithubIcon />
            </Anchor>
          ) : null}

          <ThemeSwitch
            className={css({
              display: { base: 'none', lg: 'flex' },
              p: '2',
              rounded: 'md',
              _hover: { bg: 'bg.subtle' }
            })}
          />

          <MobileNavDrawer
            trigger={
              <button
                type="button"
                aria-label="Menu"
                className={css({
                  display: { base: 'flex', lg: 'none' },
                  p: '2',
                  rounded: 'md',
                  _hover: { bg: 'bg.subtle' }
                })}
              >
                <MenuIcon className={css({ width: '5', height: '5' })} />
              </button>
            }
            header={<MobileMenuLogo />}
          >
            <MobileMenu pathname={pathname} />
          </MobileNavDrawer>
        </HStack>
      </HStack>
    </Box>
  )
}
