import { ButtonLink } from '@/components/ui/button'
import { css } from '@/styled-system/css'
import { Container, Stack, VStack, panda } from '@/styled-system/jsx'
import Image from 'next/image'

export const StartBuildingSection = () => {
  return (
    <panda.section bg="bg.main">
      <Container pt="240px" pb="24">
        <VStack>
          <Image
            src="/panda-rocket.svg"
            width={213}
            height={242}
            alt="Yums the panda riding a rocket"
            className={css({
              position: 'absolute',
              top: '-10',
              left: '50%',
              transform: 'translateX(-50%)'
            })}
          />

          <VStack gap="6">
            <panda.span
              textStyle="panda.h2"
              letterSpacing="tight"
              fontWeight="bold"
              textAlign="center"
            >
              Start building with <br />
              Panda today
            </panda.span>

            <Stack
              width="full"
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'center', sm: 'unset' }}
              justify={{ sm: 'center' }}
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
                href="/learn"
                size="lg"
                color="black"
                variant="funky"
                w={{ base: 'full', sm: '240px' }}
              >
                Learn Panda
              </ButtonLink>
            </Stack>
          </VStack>
        </VStack>
      </Container>
    </panda.section>
  )
}
