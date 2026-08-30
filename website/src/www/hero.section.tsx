import { ButtonLink } from '@/components/ui/button'
import { css } from '@/styled-system/css'
import { Box, Flex, Stack, panda } from '@/styled-system/jsx'
import { CommandPrompt } from '@/www/command-prompt'
import Image from 'next/image'

export const HeroSection = () => {
  return (
    <panda.section bg="bg.main">
      <Box maxW="8xl" mx="auto" px={{ base: '4', md: '6', lg: '8' }}>
        <Box pt="10" pb="12" position="relative">
          <Flex gap="8" align="center">
            <Stack gap="6" flex="1" minW="0">
              <panda.p
                textStyle="eyebrow"
                color="fg/70"
                hideBelow="md"
              >
                Build-time CSS-in-JS
              </panda.p>

              <div>
                <panda.p
                  fontSize={{ base: '2rem', sm: '2.75rem' }}
                  letterSpacing="tight"
                  fontWeight="bold"
                  lineHeight="1.15"
                >
                  Write type-safe styles with ease using
                </panda.p>

                <panda.h1
                  color="fg.headline"
                  fontSize={{ base: '4.5rem', sm: '7rem', lg: '8.5rem' }}
                  fontWeight="bold"
                  letterSpacing="tighter"
                  lineHeight="0.95"
                >
                  panda
                </panda.h1>
              </div>

              <panda.p
                color="fg/80"
                fontSize={{ base: 'lg', md: 'xl' }}
                letterSpacing="tight"
                fontWeight="medium"
                maxW="42rem"
                lineHeight="1.5"
              >
                Styles generated at build time, RSC compatible, multi-variant
                support, and best-in-class developer experience.
              </panda.p>

              <Stack
                align="center"
                direction={{ base: 'column', sm: 'row' }}
                gap="4"
                pt="2"
              >
                <ButtonLink
                  href="/docs"
                  size="lg"
                  color="main"
                  variant="funky"
                  w={{ base: 'full', sm: '240px' }}
                >
                  Get Started
                </ButtonLink>
                <ButtonLink
                  href="/guides"
                  size="lg"
                  color="black"
                  variant="funky"
                  w={{ base: 'full', sm: '240px' }}
                >
                  Browse Guides
                </ButtonLink>
              </Stack>

              <CommandPrompt value="npm i -D @pandacss/dev" />
            </Stack>

            <Image
              priority
              className={css({
                display: { base: 'none', lg: 'block' },
                flexShrink: 0
              })}
              src="/panda-bubble-tea.svg"
              width={300}
              height={389}
              alt="Yums the panda drinking a bubble tea"
            />
          </Flex>
        </Box>
      </Box>
    </panda.section>
  )
}
