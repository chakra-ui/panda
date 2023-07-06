import { HStack } from '@/styled-system/jsx'
import { PropsWithChildren } from 'react'
import { Logo } from './Logo'

export const Toolbar = (props: PropsWithChildren) => (
  <HStack px="6" minH="16" borderBottomWidth="1px" gap="4" borderBottomColor="border.default" alignItems="center">
    <Logo />
    <HStack flex="1" justify="space-between">
      {props.children}
    </HStack>
  </HStack>
)
