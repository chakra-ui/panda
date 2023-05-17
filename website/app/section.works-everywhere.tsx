import { ComponentPropsWithoutRef } from 'react'
import { Flex, panda } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { Icon, IconType } from '../theme/icons'

export const SectionWorksEverywhere = () => {
  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      bgColor="panda.bg.inverted"
      pt="110px"
      pb="185px"
    >
      <Flex direction="column" maxWidth="80%" alignItems="center">
        <panda.span
          fontSize="48px"
          lineHeight="60px"
          letterSpacing="tight"
          fontWeight="bold"
          textAlign="center"
        >
          Works Everywhere. <br />
          Including Server Components.
        </panda.span>

        <Flex alignItems="center" columnGap="65px" mt="55px" mb="65px">
          <ProjectLogo icon="RemixLogo" title="Remix" />
          <ProjectLogo icon="ViteLogo" title="Vite" />
          <ProjectLogo icon="NextJsLogo" title="NextJs" height="46.5" />
          <panda.div
            w="118px"
            h="118px"
            className={button({ color: 'yellow' })}
            bgColor="panda.yellow"
            color="black"
          >
            <Icon icon="LogoLetter" width="71" height="69" />
          </panda.div>
          <ProjectLogo icon="PostCSSLogo" title="PostCSS" height="45" />
          <ProjectLogo icon="AstroLogo" title="Astro" />
          <ProjectLogo icon="StoryBookLogo" title="StoryBook" height="39" />
        </Flex>
      </Flex>
      <panda.span
        fontSize="23px"
        lineHeight="32px"
        letterSpacing="tight"
        mt="68px"
        textAlign="center"
        fontWeight="semibold"
      >
        Panda works out of box with your favorite JS framework. <br />
        Use it with Vite, Remix,{' '}
        <panda.span
          position="relative"
          bgColor="panda.bg.main"
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
    <panda.div w="76px" h="76px" p="0" className={button({ color: 'border' })}>
      <Icon {...iconProps} />
    </panda.div>
    <panda.span
      pos="absolute"
      top="calc(100% + 10px)"
      left="50%"
      transform="translateX(-50%)"
      fontSize="21px"
      lineHeight="26px"
      letterSpacing="tight"
      fontWeight="bold"
    >
      {title}
    </panda.span>
  </Flex>
)
