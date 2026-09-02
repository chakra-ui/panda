import { docsConfig } from '@/docs.config'
import { css } from '@/styled-system/css'
import { Box, HStack } from '@/styled-system/jsx'
import { LuFileText, LuPencilLine } from 'react-icons/lu'

interface Props {
  /** `{tabKey}/{page}`, matching the docs route slug. */
  slug: string
  lastModified?: Date | null
}

const actionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  textStyle: 'sm',
  color: 'fg.muted',
  textDecoration: 'none',
  transitionProperty: 'color',
  transitionDuration: '150ms',
  _hover: { color: 'fg' },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '2px'
  }
})

export const PageActions = ({ slug, lastModified }: Props) => {
  const editUrl = `${docsConfig.docsRepositoryBase}/edit/v2/website/content/docs/${slug}.mdx`

  return (
    <HStack
      justify="space-between"
      flexWrap="wrap"
      gap="4"
      mt="16"
      pt="6"
      borderTopWidth="1px"
      borderColor="border"
    >
      <a
        href={editUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={actionStyles}
      >
        <LuPencilLine size={15} />
        Edit this page on GitHub
      </a>

      <a
        href={`/llms.txt/${slug}`}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          textStyle: 'eyebrow',
          color: 'fg.subtle',
          textDecoration: 'none',
          transitionProperty: 'color',
          transitionDuration: '150ms',
          _hover: { color: 'fg' }
        })}
      >
        <LuFileText size={14} aria-hidden />
        View as markdown
      </a>

      {lastModified && (
        <Box textStyle="eyebrow" color="fg.subtle" flexBasis="100%">
          {docsConfig.gitTimestamp}{' '}
          <time dateTime={lastModified.toISOString()}>
            {lastModified.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC'
            })}
          </time>
        </Box>
      )}
    </HStack>
  )
}
