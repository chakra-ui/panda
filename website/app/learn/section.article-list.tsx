/* eslint-disable @typescript-eslint/no-unused-vars */
import { ComponentPropsWithoutRef } from 'react'
import { Flex, Grid, panda } from '../../styled-system/jsx'
import { button } from '../../styled-system/recipes'
import { Icon, IconType } from '../../theme/icons'

import Articles from './articles.json'

type Video = {
  title: string
  url: string
  duration: string
  thumbnail: string
  featured?: boolean
}

type ArticleCategory =
  | 'getting-started'
  | 'design-tokens'
  | 'recipes-and-variants'

type Article = {
  title: string
  category: ArticleCategory
  slug: string
  featured?: boolean
}

const content = {
  'Design Tokens': {
    icon: 'DesignTokenBox',
    articles: Articles.filter(
      item => !item.featured && item.category === 'design-tokens'
    )
  },
  'Recipes and Variants': {
    icon: 'Recipe',
    articles: Articles.filter(
      item => !item.featured && item.category === 'recipes-and-variants'
    )
  }
}

export const SectionArticleList = () => {
  return (
    <Flex
      direction="column"
      bg={{ base: 'white', _dark: 'gray.400' }}
      px="12"
      pt="350px"
      pb={{ base: '80px', lg: '180px' }}
      gap={{ base: '50px', md: '130px' }}
    >
      {Object.entries(content).map(([title, { icon, articles }]) => (
        <Flex direction="column" key={title}>
          <panda.h3 textStyle="panda.h3" color="text.headline">
            {title}
          </panda.h3>
          <Grid
            columns={{ base: 1, md: 2 }}
            mt={{ base: '4', md: '12' }}
            gap={{ base: '4', md: '8!' }}
            justifyContent="space-between"
          >
            {articles.map(article => (
              <ArticleItem
                key={article.slug}
                icon={icon as any}
                title={article.title}
              />
            ))}
          </Grid>
        </Flex>
      ))}
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
    <panda.div w="16" h="16" p="4" className={button()} bg="yellow.300">
      <Icon {...iconProps} />
    </panda.div>
    <panda.span ml="8" textStyle="xl" letterSpacing="tight" fontWeight="bold">
      {title}
    </panda.span>
  </Flex>
)
