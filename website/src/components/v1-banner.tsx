'use client'

import { getV2Href } from '@/lib/v2-url'
import { css } from '@/styled-system/css'
import { HStack } from '@/styled-system/jsx'
import { circle } from '@/styled-system/patterns'
import { ButtonIcon } from '@/theme/icons'
import { usePathname } from 'next/navigation'

export const V1MiniBanner = () => {
  const pathname = usePathname() ?? '/'
  return (
    <a href={getV2Href(pathname)}>
      <HStack
        bg={{ base: 'gray.100', _dark: 'gray.800' }}
        px="2"
        rounded="sm"
        css={{ _icon: { width: '3' } }}
      >
        <span
          className={circle({ size: '1.5', bg: '#32aef2', flexShrink: '0' })}
        />
        <p>
          <span className={css({ hideBelow: 'xl' })}>
            You&apos;re viewing the v1 docs.{' '}
          </span>
          <span className={css({ fontWeight: 'medium' })}>
            Panda v2 is here
          </span>
        </p>
        <ButtonIcon icon="RightArrowIcon" />
      </HStack>
    </a>
  )
}

export const V1Banner = () => {
  const pathname = usePathname() ?? '/'
  return (
    <a href={getV2Href(pathname)}>
      <HStack bg="yellow.300" pos="relative">
        <HStack
          justify="center"
          px="2"
          py="2"
          rounded="sm"
          w="full"
          pos="relative"
        >
          <p className={css({ color: 'black' })}>
            <span className={css({ hideBelow: 'sm' })}>
              You&apos;re viewing the v1 docs.{' '}
            </span>
            <span className={css({ fontWeight: 'medium' })}>
              Panda v2 is here →
            </span>
          </p>
        </HStack>
      </HStack>
    </a>
  )
}
