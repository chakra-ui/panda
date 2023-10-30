import { type PropsWithChildren } from 'react'
import { version } from '@pandacss/dev/package.json'
import { css } from 'styled-system/css'
import { HStack } from 'styled-system/jsx'
import { Logo } from '../ui/logo'

export const Toolbar = (props: PropsWithChildren) => (
  <HStack px='6' minH='16' borderBottomWidth='1px' gap='4' alignItems='center'>
    <Logo />
    <span
      className={css({
        textStyle: 'sm',
      })}
    >
      v{version}
    </span>
    <HStack ml='auto'>{props.children}</HStack>
  </HStack>
)
