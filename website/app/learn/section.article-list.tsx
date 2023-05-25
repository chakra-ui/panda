import { ComponentPropsWithoutRef } from 'react'
import {
  Container,
  Grid,
  HStack,
  Square,
  Stack,
  panda
} from '../../styled-system/jsx'
import { Icon, IconType } from '../../theme/icons'

import articlesJson from './articles.json'
import { css } from '../../styled-system/css'
import Link from 'next/link'

// type Video = {
//   title: string
//   url: string
//   duration: string
//   thumbnail: string
//   featured?: boolean
// }

// type ArticleCategory =
//   | 'getting-started'
//   | 'design-tokens'
//   | 'recipes-and-variants'

// type Article = {
//   title: string
//   category: ArticleCategory
//   slug: string
//   featured?: boolean
// }

const content = {
  'Design Tokens': {
    icon: 'DesignTokenBox',
    articles: articlesJson.filter(
      item => !item.featured && item.category === 'design-tokens'
    )
  },
  'Recipes and Variants': {
    icon: 'Recipe',
    articles: articlesJson.filter(
      item => !item.featured && item.category === 'recipes-and-variants'
    )
  }
}

export const SectionArticleList = () => {
  return (
    <panda.section>
      <Container py="32">
        <Stack gap="32">
          {Object.entries(content).map(([title, { icon, articles }]) => (
            <Stack gap={{ base: '8', md: '12' }} key={title}>
              <panda.h3
                textStyle="panda.h3"
                color="text.headline"
                fontWeight="bold"
              >
                {title}
              </panda.h3>
              <Grid columns={{ base: 1, md: 2 }} gap={{ base: '4', md: '8' }}>
                {articles.map(article => (
                  <ArticleItem
                    key={article.slug}
                    icon={icon as any}
                    title={article.title}
                  />
                ))}
              </Grid>
            </Stack>
          ))}
        </Stack>
      </Container>
    </panda.section>
  )
}

const ArticleItem = ({
  title,
  ...rest
}: { icon: IconType; title: string } & ComponentPropsWithoutRef<
  typeof Icon
>) => (
  <Link href="/">
    <HStack gap="6">
      <Square
        size="16"
        layerStyle="offShadow"
        rounded="lg"
        bg="yellow.300"
        fontSize="lg"
      >
        <Icon className={css({ width: '1.4em' })} {...rest} />
      </Square>
      <panda.span textStyle="xl" letterSpacing="tight" fontWeight="semibold">
        {title}
      </panda.span>
    </HStack>
  </Link>
)
