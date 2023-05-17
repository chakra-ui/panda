import Link from 'next/link'
import { Flex, HStack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { ThemeSwitchButton } from './theme-switch-button'

export const Navbar = () => {
  return (
    <panda.div
      position="fixed"
      zIndex="1"
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
      <HStack alignItems="center">
        <Link href="/docs" className={button({ color: 'ghost' })}>
          Docs
        </Link>
        <Link href="/learn" className={button({ color: 'ghost' })}>
          Learn
        </Link>
        <Link
          href="https://github.com/chakra-ui/panda"
          target="_blank"
          className={button({ color: 'ghost' })}
        >
          Github <ButtonIcon icon="ExternalLink" />
        </Link>
        <ThemeSwitchButton />
      </HStack>
    </panda.div>
  )
}
