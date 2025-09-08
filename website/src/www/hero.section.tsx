import { CommandPrompt } from '@/www/command-prompt'
import { ButtonLink } from '@/components/ui/button'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, panda } from '@/styled-system/jsx'
import Image from 'next/image'

export const HeroSection = () => {
  return (
    <panda.section bg="bg.main">
      <Box maxW="8xl" mx="auto" px={{ base: '4', md: '6', lg: '8' }}>
        <Box pt="40" pb="24" position="relative">
          <panda.h4
            color="text.muted"
            fontSize="2xl"
            letterSpacing="tight"
            fontWeight="medium"
            maxW="4xl"
            mb="24"
            hideBelow="md"
          >
            CSS-in-JS with build time generated styles, RSC compatible,
            multi-variant support, and best-in-class developer experience
          </panda.h4>

          <Flex gap="8">
            <Stack gap="12">
              <div>
                <panda.p
                  fontSize={{ base: '2.5rem', sm: '3rem' }}
                  letterSpacing="tight"
                  fontWeight="bold"
                  lineHeight="1.2"
                  maxW={{ base: '40rem', md: 'unset' }}
                >
                  Write type-safe styles with ease using
                </panda.p>

                <panda.h1
                  color="text.headline"
                  fontSize={{ base: '7rem', sm: '12rem', lg: '14.5rem' }}
                  fontWeight="bold"
                  letterSpacing="tighter"
                  lineHeight="1"
                >
                  panda
                </panda.h1>
              </div>
              <Stack
                align="center"
                direction={{ base: 'column', sm: 'row' }}
                gap="6"
              >
                <ButtonLink
                  href="/docs"
                  size="lg"
                  color="main"
                  w={{ base: 'full', sm: '240px' }}
                >
                  Get Started
                </ButtonLink>
                <ButtonLink
                  href="/learn"
                  size="lg"
                  color="black"
                  w={{ base: 'full', sm: '240px' }}
                >
                  Learn Panda
                </ButtonLink>
              </Stack>

              <CommandPrompt value="npm i -D @pandacss/dev" />
            </Stack>

            <Image
              priority
              className={css({ display: { base: 'none', sm: 'block' } })}
              src="/panda-bubble-tea.svg"
              width={369}
              height={478}
              alt="Yums the panda drinking a bubble tea"
            />
          </Flex>
        </Box>
      </Box>
    </panda.section>
  )
}
