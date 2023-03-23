import { HStack } from '../../../design-system/jsx'
import type { PropsWithChildren } from 'react'
import { Logo } from './Logo'

export const Toolbar = (props: PropsWithChildren) => (
  <HStack px="6" minH="16" borderBottomWidth="1px" gap="6">
    <Logo />
    <HStack flex="1" justifyContent="space-between">
      {props.children}
    </HStack>
  </HStack>
)
