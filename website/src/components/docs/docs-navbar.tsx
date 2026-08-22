'use client'

import { CourseBanner } from '@/components/course-banner'
import { CommandMenu } from '@/components/docs/command-menu'
import { SearchButton } from '@/components/docs/search'
import { Sidebar } from '@/components/docs/sidebar'
import { Anchor } from '@/components/ui/anchor'
import { docsConfig } from '@/docs.config'
import { GithubIcon, MenuIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import { Icon } from '@/theme/icons'
import { MobileNavDrawer, MobileTabSwitcher } from '@/mdx/navbar'
import { ThemeSwitch } from '@/mdx/theme-switch'
import { usePathname } from 'next/navigation'

/**
 * The docs-only top bar: logo left, search centered, Playground/GitHub/theme
 * on the right, no text nav links and no border under it, the TabBar directly
 * below owns the one dividing line for the whole header block. This is
 * deliberately separate from the site-wide `Navbar` in `mdx/navbar.tsx`, which
 * still serves the marketing pages (home, blog, team, showcase) unchanged.
 *
 * Fixed position (not just sticky), matching the site-wide navbar's own
 * behavior, since `app/docs/layout.tsx`'s sticky TabBar offset and `main`'s
 * padding-top are both computed against `--navbar-height` assuming the bar
 * above it is taken out of normal document flow.
 */
export function DocsNavbar() {
  const pathname = usePathname()

  return (
    <Box as="header" position="fixed" top="0" insetX="0" zIndex="20" bg="bg">
      <CourseBanner />

      <HStack
        h="var(--navbar-height, 4rem)"
        px="6"
        gap="4"
        justifyContent="space-between"
      >
        <Anchor
          href="/"
          className={css({ flexShrink: '0', display: 'flex', _hover: { opacity: 0.75 } })}
        >
          <Icon icon="LogoWithText" />
        </Anchor>

        <Box flex="1" display="flex" justifyContent="center" maxW={{ base: 'none', md: '32rem' }}>
          <CommandMenu
            trigger={
              <SearchButton
                containerClassName={css({ flex: '1', width: 'full', maxW: '28rem' })}
                className={css({ width: 'full' })}
              />
            }
            mediaQuery="max-width: 640px"
          />
        </Box>

        <HStack gap="2" flexShrink="0">
          <Anchor
            href="https://play.panda-css.com/"
            newWindow
            className={css({
              display: 'flex',
              alignItems: 'center',
              px: '3',
              py: '2',
              rounded: 'md',
              bg: 'accent',
              color: 'black',
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
                display: 'flex',
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
          >
            <div className={css({ pt: '8' })}>
              <MobileTabSwitcher pathname={pathname} />
              <Sidebar slug={pathname} />
            </div>
          </MobileNavDrawer>
        </HStack>
      </HStack>
    </Box>
  )
}
