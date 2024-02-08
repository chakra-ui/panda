import { HStack, Flex } from '@/styled-system/jsx'
import { PropsWithChildren } from 'react'
import { Logo } from './Logo'
import { css } from '@/styled-system/css'
import pkgJson from '@pandacss/dev/package.json'
import { ColorModeSwitch } from '@/src/components/ColorModeSwitch'

export const Toolbar = (props: PropsWithChildren) => (
  <Flex px="6" minH="16" borderBottomWidth="1px" align="center" justify="space-between">
    <HStack gap="4">
      <a href="/">
        <Logo />
      </a>
      <span
        className={css({
          textStyle: 'sm',
        })}
      >
        v{pkgJson.version}
      </span>
    </HStack>
    <HStack
      css={{
        '& > *:not(:last-child):not(:first-child)': {
          hideBelow: 'md',
        },
      }}
    >
      {props.children}
      <ColorModeSwitch />
    </HStack>
  </Flex>
)
