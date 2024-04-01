import * as React from 'react'
import { Flex, HStack, Square, Stack, panda } from '../../styled-system/jsx'
import * as context from '../lib/panda-context'
import { EmptyState } from './empty-state'
import { TypographyIcon } from './icons'

const fonts = context.getTokens('fonts')

const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const symbols = Array.from({ length: 10 }, (_, i) => String.fromCharCode(48 + i))
const specials = ['@', '#', '$', '%', '&', '!', '?', '+', '-']

export const FontFamily = () => {
  if (fonts.length === 0) {
    return (
      <EmptyState title="No Tokens" icon={<TypographyIcon />}>
        The panda config does not contain any font family
      </EmptyState>
    )
  }

  return (
    <Stack gap="10">
      {fonts.map((font) => (
        <Stack key={font.name} gap="8">
          <HStack gap="10" style={{ fontFamily: font.value }}>
            <panda.p fontSize="100px" fontWeight="bold" lineHeight="1">
              Ag
            </panda.p>

            <Flex wrap="wrap" fontSize="24px" mt="8">
              {letters.map((letter) => (
                <Square textTransform="uppercase" size="8" key={letter}>
                  {letter}
                </Square>
              ))}
              {letters.map((letter) => (
                <Square textTransform="lowercase" size="8" key={letter}>
                  {letter}
                </Square>
              ))}
              {symbols.map((sym) => (
                <Square textTransform="lowercase" size="8" key={sym}>
                  {sym}
                </Square>
              ))}
              {specials.map((sym) => (
                <Square textTransform="lowercase" size="8" key={sym}>
                  {sym}
                </Square>
              ))}
            </Flex>
          </HStack>

          <Stack>
            <panda.span fontWeight="semibold">{font.extensions.prop}</panda.span>
            <panda.span fontFamily={font.value} opacity="0.7">
              {font.value}
            </panda.span>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}
