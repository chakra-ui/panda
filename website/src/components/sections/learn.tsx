import { css } from '@/styled-system/css'
import { Container, HStack, Stack, panda } from '@/styled-system/jsx'
import Image from 'next/image'

export const SectionLearn = () => (
  <panda.section bg="bg.main">
    <Container pt="40" pb="20" px="4">
      <HStack gap="14" mb={{ base: '10', md: '0' }}>
        <Stack gap="10" flex="1">
          <Stack gap="2">
            <panda.h1
              color="text.headline"
              textStyle="panda.h1"
              fontWeight="bold"
            >
              Learn.
            </panda.h1>
            <panda.p
              color="text.muted"
              textStyle="panda.h4"
              fontWeight="medium"
            >
              Tutorials and videos to get started with Panda.
            </panda.p>
          </Stack>
        </Stack>

        <Image
          src="/panda-scooter.svg"
          width={365}
          height={469}
          alt="Yums the panda driving a scooter"
          className={css({
            zIndex: '1',
            display: { base: 'none', lg: 'block' },
            position: 'relative',
            top: '10'
          })}
        />
      </HStack>
    </Container>
  </panda.section>
)
