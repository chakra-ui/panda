'use client'
import { css } from '@/styled-system/css'
import { Center, HStack, Stack } from '@/styled-system/jsx'
import { center } from '@/styled-system/patterns'
import { ButtonIcon, Icon } from '@/theme/icons'
import { Dialog } from '@ark-ui/react/dialog'
import Link from 'next/link'
import { MenuIcon } from '@/icons'
import { NavLink } from './nav-link'
import { ThemeSwitchIconButton } from './theme-switch-button'
import { drawerSlotRecipe } from './ui/drawer'

export const MobileNavBar = () => {
  return (
    <HStack
      bg="bg"
      height="16"
      shadow="lg"
      py="5"
      px="4"
      borderRadius="md"
      zIndex="1"
      position="relative"
      justify="space-between"
    >
      <Link href="/" className={center({ flexShrink: '0' })}>
        <Icon icon="LogoWithText" />
      </Link>

      <HStack gap="4">
        <ThemeSwitchIconButton />
        <MobileNavDrawer
          trigger={
            <button className={css({ px: '1', py: '1' })}>
              <MenuIcon />
            </button>
          }
        >
          <Stack>
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/team">Team</NavLink>
            <NavLink href="/learn">Learn</NavLink>
            <NavLink href="https://play.panda-css.com/" isExternal>
              <HStack>
                <span>Playground</span>
                <ButtonIcon icon="ExternalLink" />
              </HStack>
            </NavLink>
            <NavLink href="https://github.com/chakra-ui/panda" isExternal>
              <HStack>
                <span>Github</span>
                <ButtonIcon icon="ExternalLink" />
              </HStack>
            </NavLink>
          </Stack>
        </MobileNavDrawer>
      </HStack>
    </HStack>
  )
}

interface MobileNavDrawerProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

const MobileNavDrawer = (props: MobileNavDrawerProps) => {
  const { trigger, children } = props
  const classes = drawerSlotRecipe({ size: 'md', placement: 'bottom' })
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Backdrop className={classes.backdrop} />
      <Dialog.Positioner className={classes.positioner}>
        <Dialog.Content className={classes.content}>
          <div className={classes.body}>{children}</div>
          <Dialog.CloseTrigger className={classes.closeTrigger}>
            <Center width="5" height="5" color="fg">
              <Icon
                icon="Close"
                className={css({ width: '1em', height: 'auto' })}
              />
            </Center>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
