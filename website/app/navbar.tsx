import Link from 'next/link'
import { HStack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { ButtonIcon, Icon } from '../theme/icons'
import { css } from '../styled-system/css'
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
      fontSize="21px"
      px="26px"
      py="24px"
    >
      <HStack alignItems="center">
        <Icon icon="Logo" className={css({ color: 'panda.yellow' })} />
        <panda.span fontWeight="bold" fontSize="lg" letterSpacing="tighter">
          panda
        </panda.span>
      </HStack>
      <HStack alignItems="center">
        {/* TODO fix links */}
        <Link href="/docs" className={button({ color: 'ghost' })}>
          Docs
        </Link>
        {/* TODO fix links */}
        <Link href="/docs" className={button({ color: 'ghost' })}>
          Learn
        </Link>
        {/* TODO fix links */}
        <Link href="/docs" className={button({ color: 'ghost' })}>
          Github <ButtonIcon icon="ExternalLink" />
        </Link>
        <ThemeSwitchButton />
      </HStack>
    </panda.div>
  )
}
