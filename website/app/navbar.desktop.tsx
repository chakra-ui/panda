import Link from 'next/link'
import { HStack } from '../styled-system/jsx'
import { ButtonIcon, Icon } from '../theme/icons'
import { NavLink } from './nav-link'
import { ThemeSwitchButton } from './theme-switch-button'
import { css } from '../styled-system/css'

export const DesktopNavBar = () => {
  return (
    <HStack
      bg="bg.inverted"
      height="16"
      py="5"
      px="4"
      borderRadius="md"
      zIndex="1"
      position="relative"
      justify="space-between"
    >
      <Link href="/" className={css({ flexShrink: '0' })}>
        <Icon icon="LogoWithText" />
      </Link>

      <HStack gap="4">
        <NavLink href="/docs">Docs</NavLink>
        <NavLink href="/learn">Learn</NavLink>
        <NavLink href="https://github.com/chakra-ui/panda">
          <HStack>
            <span>Github</span>
            <ButtonIcon icon="ExternalLink" />
          </HStack>
        </NavLink>
        <ThemeSwitchButton />
      </HStack>
    </HStack>
  )
}
