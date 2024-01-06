import { HStack } from '@/styled-system/jsx'
import { PropsWithChildren } from 'react'
import { Logo } from './Logo'
import { css } from '@/styled-system/css'
import pkgJson from '@pandacss/dev/package.json'

export const Toolbar = (props: PropsWithChildren) => (
  <HStack px="6" minH="16" borderBottomWidth="1px" gap="4" alignItems="center">
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
    <HStack ml="auto">{props.children}</HStack>
  </HStack>
)
