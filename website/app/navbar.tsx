'use client'

import Link from 'next/link'
import { Flex, HStack, Stack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { ThemeSwitchButton } from './theme-switch-button'
import { GitHubIcon, MenuIcon } from 'nextra/icons'
import { css, cx } from '../styled-system/css'
import { useState } from 'react'
import { SystemStyleObject } from '../styled-system/types'
import type { Dispatch, SetStateAction } from 'react'

const navbarStyles = {
  bgColor: 'panda.bg.inverted',
  borderRadius: '9px',
  boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
  textStyle: 'xl',
  px: '26px'
} satisfies SystemStyleObject

export const Navbar = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)

  return (
    <panda.div
      position="fixed"
      maxWidth="8xl"
      m="auto"
      zIndex="10"
      top="22px"
      left="30px"
      right="30px"
      borderRadius="9px"
      px="26px"
      data-mobile-open={isMenuOpen ? '' : undefined}
    >
      <DesktopMenu isMenuOpen={isMenuOpen} setMenuOpen={setMenuOpen} />
      <MobileMenu isMenuOpen={isMenuOpen} setMenuOpen={setMenuOpen} />
    </panda.div>
  )
}

const DesktopMenu = ({
  isMenuOpen,
  setMenuOpen
}: {
  isMenuOpen: boolean
  setMenuOpen: Dispatch<SetStateAction<boolean>>
}) => {
  return (
    <Flex
      {...navbarStyles}
      height="75px"
      py="24px"
      zIndex={1}
      position="relative"
      alignItems="center"
      justifyContent="space-between"
      className={
        isMenuOpen
          ? css({ boxShadow: 'none!', borderBottomRadius: '0!' })
          : undefined
      }
    >
      <Flex alignItems="center">
        <Link href="/">
          <Icon icon="LogoWithText" />
        </Link>
      </Flex>
      <HStack alignItems="center" display={{ base: 'none', md: 'flex' }}>
        <MenuLinks />
        <Link
          href="https://github.com/chakra-ui/panda"
          target="_blank"
          className={cx(
            button({ color: 'ghost' }),
            css({ p: '2', lg: { px: 6, py: 3 } })
          )}
        >
          <div
            className={css({
              display: { base: 'none', lg: 'flex' },
              alignItems: 'center'
            })}
          >
            Github <ButtonIcon icon="ExternalLink" />
          </div>
          <GitHubIcon
            className={css({ display: { base: 'initial', lg: 'none' } })}
          />
        </Link>
        <ThemeSwitchButton p="2" lg={{ px: 6, py: 3 }} />
      </HStack>
      <HStack alignItems="center" md={{ display: 'none' }} gap="4">
        <GitHubIcon />
        <MenuIcon
          className={cx(css(mobileMenuStyles), isMenuOpen && 'open')}
          onClick={() => setMenuOpen(current => !current)}
        />
        <ThemeSwitchButton lite p="2" />
      </HStack>
    </Flex>
  )
}

const MobileMenu = ({
  isMenuOpen,
  setMenuOpen
}: {
  isMenuOpen: boolean
  setMenuOpen: Dispatch<SetStateAction<boolean>>
}) => {
  return (
    <Flex
      display={{ md: 'none' }}
      pointerEvents={isMenuOpen ? 'initial' : 'none'}
      opacity={{ base: isMenuOpen ? '1' : '0' }}
      transitionProperty="opacity"
      zIndex={0}
      position="fixed"
      top="0"
      left="0"
      w="100vw"
      h="100vh"
    >
      <panda.div
        w="100%"
        h="100%"
        backgroundColor="panda.text.muted"
        cursor="pointer"
        onClick={() => setMenuOpen(false)}
      />
      <Stack
        {...navbarStyles}
        position="absolute"
        top="95px"
        left="30px"
        right="30px"
        zIndex={1}
        py="16px"
        borderTopRadius={'0!' as any}
      >
        <Separator />
        <MenuLinks />
      </Stack>
    </Flex>
  )
}

const Separator = () => (
  <panda.div
    bgColor="panda.text.muted"
    h="1px"
    w="90%"
    alignSelf="center"
    opacity="0.2"
    md={{ display: 'none' }}
  />
)

const MenuLinks = () => {
  return (
    <>
      <Link
        href="/docs"
        className={cx(
          button({ color: 'ghost' }),
          css({ p: '2', lg: { px: 6, py: 3 } })
        )}
      >
        Docs
      </Link>
      <Separator />
      <Link
        href="/learn"
        className={cx(
          button({ color: 'ghost' }),
          css({ p: '2', lg: { px: 6, py: 3 } })
        )}
      >
        Learn
      </Link>
    </>
  )
}

const mobileMenuStyles = {
  cursor: 'pointer',
  '& g': {
    transformOrigin: 'center',
    transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
  },
  '& path': {
    opacity: 1,
    transition:
      'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s, opacity 0.2s ease 0.2s'
  },
  '&.open': {
    '& path': {
      transition:
        'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease'
    },
    '& g': {
      transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.2s'
    },
    '&.open >': {
      '& path': {
        opacity: 0
      },
      '& g:nth-of-type(1)': {
        transform: 'rotate(45deg)',
        '& path': {
          transform: 'translate3d(0, 6px, 0)'
        }
      },
      '& g:nth-of-type(2)': {
        transform: 'rotate(-45deg)',
        '& path': {
          transform: 'translate3d(0, -6px, 0)'
        }
      }
    }
  }
} as SystemStyleObject
