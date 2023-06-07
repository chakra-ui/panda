import Image from 'next/image'
import Link from 'next/link'
import { css, cx } from '../styled-system/css'
import { Box, Flex, Stack, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { CommandPrompt } from './command-prompt'

export const SectionHero = () => {
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
                  fontSize={{ base: '8.5rem', sm: '12rem', lg: '14.5rem' }}
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
                <Link
                  href="/docs"
                  className={cx(
                    button({ color: 'main', size: 'lg' }),
                    css({ w: { base: 'full', sm: '240px' } })
                  )}
                >
                  Get Started
                </Link>
                <Link
                  href="/learn"
                  className={cx(
                    button({ color: 'black', size: 'lg' }),
                    css({ w: { base: 'full', sm: '240px' } })
                  )}
                >
                  Learn Panda
                </Link>
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
