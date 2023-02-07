import Frame from 'react-frame-component'
import { LiveError, LivePreview, LiveProvider } from 'react-live'
import { css, cva, cx } from '@/design-system/css'
import { Flex } from '@/design-system/jsx'
import { useIsClient } from 'usehooks-ts'

export type PreviewProps = {
  previewCss?: string
  source: string
}
export const Preview = ({ previewCss = '', source }: PreviewProps) => {
  const isClient = useIsClient()
  // prevent false positive for server-side rendering
  if (!isClient) {
    return null
  }

  return (
    <Flex px="6" py="4" flex="1" align="stretch">
      <Frame head={<style>{previewCss}</style>} width="100%" allow="none">
        <LiveProvider
          code={source
            .replaceAll(/import.*/g, '')
            .replaceAll(/export /g, '')
            .concat('\nrender(<App />)')}
          scope={{ css, cva, cx }}
          noInline
        >
          <LiveError />
          <LivePreview />
        </LiveProvider>
      </Frame>
    </Flex>
  )
}
