import { Docs } from '.velite'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { CopyMdxWidget } from './copy-mdx-widget'

interface DocProps {
  doc: Docs
}

export function DocsHeader({ doc }: DocProps) {
  return (
    <Flex justify="space-between" align="flex-start" gap="4" mb="8">
      <div>
        <h1
          className={css({
            fontSize: { base: '3xl', md: '4xl' },
            fontWeight: 'bold',
            lineHeight: 'tight',
            mb: 2
          })}
        >
          {doc.title}
        </h1>
        {doc.description && (
          <p
            className={css({
              fontSize: 'lg',
              color: 'fg.muted',
              maxW: '3xl'
            })}
          >
            {doc.description}
          </p>
        )}
      </div>

      <CopyMdxWidget doc={doc} />
    </Flex>
  )
}
