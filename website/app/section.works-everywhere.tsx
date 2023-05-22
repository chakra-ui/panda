import { ComponentPropsWithoutRef } from 'react'
import { Flex, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { Icon, IconType } from '../theme/icons'
import { Content } from './content'

export const SectionWorksEverywhere = () => {
  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      bg="bg.inverted"
      pt={{ base: '40px', lg: '110px' }}
      pb={{ base: '100px', lg: '185px' }}
    >
      <Content alignItems="center">
        <panda.h2 textStyle="panda.h2" textAlign="center">
          Works Everywhere. <br />
          Including Server Components.
        </panda.h2>

        <Flex
          alignItems="center"
          columnGap={{ base: '45px', lg: '65px' }}
          mt={{ base: '40px', lg: '55px' }}
          mb={{ base: '40px', lg: '65px' }}
          rowGap="45px"
          flexDirection={{ base: 'column', md: 'row' }}
        >
          <Flex columnGap={{ base: '45px', lg: '65px' }}>
            <ProjectLogo icon="RemixLogo" title="Remix" />
            <ProjectLogo icon="ViteLogo" title="Vite" />
            <ProjectLogo icon="NextJsLogo" title="NextJs" height="46.5" />
          </Flex>
          <panda.div
            w="118px"
            h="118px"
            className={button({ color: 'yellow' })}
            bg="yellow.400"
            color="black"
          >
            <Icon icon="LogoLetter" width="71" height="69" />
          </panda.div>
          <Flex columnGap={{ base: '45px', lg: '65px' }}>
            <ProjectLogo icon="PostCSSLogo" title="PostCSS" height="45" />
            <ProjectLogo icon="AstroLogo" title="Astro" />
            <ProjectLogo icon="StoryBookLogo" title="StoryBook" height="39" />
          </Flex>
        </Flex>
      </Content>
      <panda.span
        textStyle="2xl"
        lineHeight="2rem"
        letterSpacing="tight"
        mt={{ base: '50px', lg: '68px' }}
        textAlign="center"
        fontWeight="semibold"
        maxWidth="80%"
      >
        Panda works out of box with your favorite JS framework. <br />
        Use it with Vite, Remix,{' '}
        <panda.span
          position="relative"
          bg="bg.main"
          inset="0"
          rounded="lg"
          p="2"
        >
          Next.js (including app dir)
        </panda.span>
      </panda.span>
    </Flex>
  )
}

const ProjectLogo = ({
  title,
  ...iconProps
}: { icon: IconType; title: string } & ComponentPropsWithoutRef<
  typeof Icon
>) => (
  <Flex direction="column" pos="relative">
    <panda.div
      w={{ base: '50px', lg: '76px' }}
      h={{ base: '50px', lg: '76px' }}
      p={{ base: '12px', lg: '0' }}
      className={button({ color: 'border' })}
    >
      <Icon {...iconProps} />
    </panda.div>
    <panda.span
      pos="absolute"
      top="calc(100% + 10px)"
      left="50%"
      transform="translateX(-50%)"
      textStyle="xl"
      letterSpacing="tight"
      fontWeight="bold"
    >
      {title}
    </panda.span>
  </Flex>
)
