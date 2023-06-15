import { ComponentPropsWithoutRef } from 'react'
import {
  Container,
  HStack,
  Square,
  Stack,
  VStack,
  panda
} from '@/styled-system/jsx'
import { Icon, IconType } from '@/theme/icons'

export const SectionWorksEverywhere = () => {
  return (
    <section>
      <Container pt="32" pb="48">
        <VStack gap="20">
          <panda.h2 textStyle="panda.h2" fontWeight="bold" textAlign="center">
            Works Everywhere. <br />
            Including Server Components.
          </panda.h2>

          <Stack
            gap="12"
            direction={{ base: 'column', lg: 'row' }}
            align="center"
          >
            <HStack gap="12">
              <ProjectLogo icon="RemixLogo" title="Remix" />
              <ProjectLogo icon="ViteLogo" title="Vite" />
              <ProjectLogo icon="NextJsLogo" title="NextJs" height="46.5" />
            </HStack>

            <Square
              position="relative"
              top={{ lg: '-3' }}
              size="120px"
              layerStyle="offShadow"
              bg="yellow.300"
              color="black"
              rounded="lg"
            >
              <Icon icon="LogoLetter" width="71" height="69" />
            </Square>

            <HStack gap="12">
              <ProjectLogo icon="PostCSSLogo" title="PostCSS" height="45" />
              <ProjectLogo icon="AstroLogo" title="Astro" />
              <ProjectLogo icon="StoryBookLogo" title="StoryBook" height="39" />
            </HStack>
          </Stack>

          <VStack maxW="560px" mx="auto">
            <panda.span
              textStyle="2xl"
              fontWeight="medium"
              letterSpacing="tight"
              textAlign="center"
            >
              Panda works out of box with your favorite JS framework. Use it
              with Vite, Remix,{' '}
              <panda.mark
                bg="yellow.300"
                rounded="lg"
                px="2"
                py="1"
                boxDecorationBreak="clone"
              >
                Next.js (including app dir)
              </panda.mark>
            </panda.span>
          </VStack>
        </VStack>
      </Container>
    </section>
  )
}

const ProjectLogo = ({
  title,
  ...iconProps
}: { icon: IconType; title: string } & ComponentPropsWithoutRef<
  typeof Icon
>) => (
  <VStack>
    <Square
      size="20"
      rounded="lg"
      layerStyle="offShadow"
      _dark={{ boxShadowColor: 'yellow.300' }}
    >
      <Icon {...iconProps} />
    </Square>
    <panda.span textStyle="xl" letterSpacing="tight" fontWeight="bold">
      {title}
    </panda.span>
  </VStack>
)
