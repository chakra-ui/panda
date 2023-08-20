import { HStack } from '@/styled-system/jsx'
import { PropsWithChildren } from 'react'
import { Logo } from './Logo'
import { css } from '@/styled-system/css'
import { version } from 'package.json'

export const Toolbar = (props: PropsWithChildren) => (
  <HStack px="6" minH="16" borderBottomWidth="1px" gap="4" alignItems="center">
    <Logo />
    <span
      className={css({
        textStyle: 'sm',
      })}
    >
      v{version}
    </span>
    <HStack ml="auto">{props.children}</HStack>
  </HStack>
)
