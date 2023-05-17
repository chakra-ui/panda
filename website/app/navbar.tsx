import Link from 'next/link'
import { Flex, HStack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { ThemeSwitchButton } from './theme-switch-button'
import { GitHubIcon, MenuIcon } from 'nextra/icons'
import { css, cx } from '../styled-system/css'

export const Navbar = () => {
  // TODO mobile menu toggle
  const isMenuOpen = false

  return (
    <panda.div
      position="fixed"
      zIndex="10"
      top="22px"
      left="30px"
      right="30px"
      bgColor="panda.bg.inverted"
      borderRadius="9px"
      boxShadow="0px 4px 4px 0px rgba(0, 0, 0, 0.05)"
      height="75px"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      textStyle="xl"
      px="26px"
      py="24px"
    >
      <Flex alignItems="center">
        <Link href="/">
          <Icon icon="LogoWithText" />
        </Link>
      </Flex>
      <HStack alignItems="center" display={{ base: 'none', md: 'flex' }}>
        <Link
          href="/docs"
          className={cx(
            button({ color: 'ghost' }),
            css({ p: '2', lg: { px: 6, py: 3 } })
          )}
        >
          Docs
        </Link>
        <Link
          href="/learn"
          className={cx(
            button({ color: 'ghost' }),
            css({ p: '2', lg: { px: 6, py: 3 } })
          )}
        >
          Learn
        </Link>
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
        <MenuIcon className={cx(isMenuOpen && 'open')} />
        <ThemeSwitchButton lite p="2" />
      </HStack>
    </panda.div>
  )
}
