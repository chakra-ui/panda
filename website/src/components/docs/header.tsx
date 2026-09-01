import { getMarkdown, type DocPage } from '@/lib/source'
import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { CopyMdxWidget } from './copy-mdx-widget'

interface Props {
  page: DocPage
}

export const Header = async ({ page }: Props) => {
  const { title, description } = page.data
  const markdown = await getMarkdown(page)

  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      justify={{ md: 'space-between' }}
      align="flex-start"
      gap="4"
      mb="12"
      mt="8"
    >
      <div>
        <h1
          className={css({
            fontSize: { base: '3xl', md: '4xl' },
            fontWeight: 'bold',
            lineHeight: 'tight',
            mb: 2
          })}
        >
          {title}
        </h1>
        {description && (
          <p
            className={css({ fontSize: 'lg', color: 'fg.muted', maxW: '3xl' })}
          >
            {description}
          </p>
        )}
      </div>

      <CopyMdxWidget url={page.url} markdown={markdown} />
    </Flex>
  )
}
