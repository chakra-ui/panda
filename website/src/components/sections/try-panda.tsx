import Image from 'next/image'
import { ComponentPropsWithoutRef } from 'react'
import { css } from '@/styled-system/css'
import { Container, Grid, HStack, Stack, panda } from '@/styled-system/jsx'
import { CommandPrompt } from '../command-prompt'

const installSteps = [
  {
    title: 'Install Panda in your project',
    command: 'npm i -D @pandacss/dev'
  },
  {
    title: 'Run the initialize command',
    command: 'npm run panda init -p'
  },
  {
    title: 'Start using Panda in your project',
    command: 'npm run dev'
  }
]

export const SectionTryPanda = () => {
  return (
    <panda.section bg={{ base: 'black', _dark: 'gray.700' }}>
      <Container pt="28" pb="24">
        <HStack gap="12">
          <panda.div
            flex="1"
            maxW="3xl"
            bg="yellow.300"
            color="black"
            position="relative"
            borderRadius="xl"
          >
            <panda.h3 textStyle="panda.h2" fontWeight="bold" py="6" px="8">
              Love what you see? <br />
              Try Panda in 3 quick steps
            </panda.h3>
            <ChatTip
              className={css({
                display: { base: 'none', md: 'block' },
                pos: 'absolute',
                top: '50%',
                left: 'calc(100% - 2px)',
                transform: 'translateY(-50%)',
                color: 'yellow.300'
              })}
            />
          </panda.div>

          <Image
            src="/panda-hello.svg"
            width={196}
            height={261}
            alt="Yums the panda waving"
            className={css({
              display: { base: 'none', md: 'block' },
              w: '56'
            })}
          />
        </HStack>

        <Grid mt="20" gap="10" columns={{ base: 1, md: 3 }}>
          {installSteps.map((step, i) => (
            <Stack color="white" gap={{ base: '2', md: '8' }}>
              <Stack gap="4" direction={{ base: 'row', md: 'column' }}>
                <panda.span
                  key={i}
                  fontSize={{ base: '2rem', md: '6rem' }}
                  fontWeight="bold"
                  letterSpacing="tight"
                  lineHeight="1"
                  color="yellow.300"
                >
                  {i + 1}
                </panda.span>
                <panda.span
                  fontWeight="semibold"
                  textStyle="panda.h4"
                  maxW={{ lg: '240px' }}
                >
                  {step.title}
                </panda.span>
              </Stack>
              <CommandPrompt value={step.command} />
            </Stack>
          ))}
        </Grid>
      </Container>
    </panda.section>
  )
}

const ChatTip = (props: ComponentPropsWithoutRef<'svg'>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="772.9 44.1775 49.2 95.92"
    width="24"
    height="44"
    {...props}
  >
    <path
      d="M 773 140 L 821.118 53.3869 C 823.791 48.9638 819.994 43.4556 814.91 44.3801 L 773 52 Z"
      fill="currentColor"
    />
  </svg>
)
