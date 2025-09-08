import { Docs } from '.velite'
import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { CopyMdxWidget } from './copy-mdx-widget'

interface Props {
  doc: Docs
}

export const Header = ({ doc }: Props) => {
  return (
    <Flex justify="space-between" align="flex-start" gap="4" mb="12" mt="8">
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
            className={css({ fontSize: 'lg', color: 'fg.muted', maxW: '3xl' })}
          >
            {doc.description}
          </p>
        )}
      </div>

      <CopyMdxWidget doc={doc} />
    </Flex>
  )
}
