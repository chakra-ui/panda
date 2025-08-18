import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'
import { center } from '@/styled-system/patterns'
import { Icon } from '@/theme/icons'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa'
import { CourseMiniBanner } from './course-banner'
import { NavLink } from './nav-link'
import { ThemeSwitchIconButton } from './theme-switch-button'

export const DesktopNavBar = () => {
  return (
    <HStack
      bg="bg.inverted"
      shadow="lg"
      height="16"
      py="5"
      px="4"
      borderRadius="md"
      zIndex="1"
      position="relative"
      justify="space-between"
    >
      <HStack gap="4">
        <Link href="/" className={center({ flexShrink: '0' })}>
          <Icon icon="LogoWithText" />
        </Link>
        <CourseMiniBanner />
      </HStack>

      <HStack gap="4">
        <NavLink href="/docs">Docs</NavLink>
        <NavLink href="/team">Team</NavLink>
        <NavLink href="/learn">Learn</NavLink>
        <NavLink href="https://play.panda-css.com/" isExternal>
          Playground
        </NavLink>
        <NavLink href="https://github.com/chakra-ui/panda" isExternal>
          <FaGithub className={css({ fontSize: '2xl' })} />
        </NavLink>
        <ThemeSwitchIconButton />
      </HStack>
    </HStack>
  )
}
