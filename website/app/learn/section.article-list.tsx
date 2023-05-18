import { ComponentPropsWithoutRef } from 'react'
import { Flex, Grid, panda } from '../../styled-system/jsx'
import { button } from '../../styled-system/recipes'
import { Icon, IconType } from '../../theme/icons'

export const SectionArticleList = () => {
  return (
    <Flex
      direction="column"
      backgroundColor={{ base: 'white', _dark: 'panda.gray.400' }}
      px="48px"
      pt="350px"
      pb={{ base: '80px', lg: '180px' }}
      gap={{ base: '50px', md: '130px' }}
    >
      <Flex direction="column">
        <panda.h3 textStyle="panda.h3" color="panda.text.headline">
          Design Tokens
        </panda.h3>
        <Grid
          columns={{ base: 1, md: 2 }}
          mt={{ base: 4, md: '12' }}
          gap={{ base: 4, md: '8!' }}
          justifyContent="space-between"
        >
          <ArticleItem
            icon="DesignTokenBox"
            title="How to create semantic tokens"
          />
          <ArticleItem
            icon="DesignTokenBox"
            title="Naming conventions for semantic tokens"
          />
          <ArticleItem
            icon="DesignTokenBox"
            title="Sync tokens from Style Dictionary"
          />
          <ArticleItem
            icon="DesignTokenBox"
            title="How to defined text and layer style"
          />
        </Grid>
      </Flex>
      <Flex direction="column">
        <panda.h3 textStyle="panda.h3" color="panda.text.headline">
          Recipe and Variants
        </panda.h3>
        <Grid
          columns={{ base: 1, md: 2 }}
          mt={{ base: 4, md: '12' }}
          gap={{ base: 4, md: '8!' }}
          justifyContent="space-between"
        >
          <ArticleItem icon="Recipe" title="How to write cleaner recipes" />
          <ArticleItem icon="Recipe" title="How to theme components" />
          <ArticleItem icon="Recipe" title="How to create semantic tokens" />
          <ArticleItem icon="Recipe" title="How to create semantic tokens" />
        </Grid>
      </Flex>
    </Flex>
  )
}

const ArticleItem = ({
  title,
  ...iconProps
}: { icon: IconType; title: string } & ComponentPropsWithoutRef<
  typeof Icon
>) => (
  <Flex>
    <panda.div
      w="64px"
      h="64px"
      p="4"
      className={button()}
      backgroundColor="panda.yellow"
    >
      <Icon {...iconProps} />
    </panda.div>
    <panda.span
      ml="30px"
      textStyle="xl"
      letterSpacing="tight"
      fontWeight="bold"
    >
      {title}
    </panda.span>
  </Flex>
)
