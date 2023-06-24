import Frame, { FrameContextConsumer } from 'react-frame-component'
import { LiveError, LivePreview, LiveProvider } from 'react-live'
import { useIsClient } from 'usehooks-ts'
import { Flex } from '@/styled-system/jsx'

export type PreviewProps = {
  previewCss?: string
  previewJs?: string
  source: string
  patternNames: string[]
}
export const Preview = ({ previewCss = '', previewJs = '', patternNames, source }: PreviewProps) => {
  const isClient = useIsClient()
  // prevent false positive for server-side rendering
  if (!isClient) {
    return null
  }

  const initialContent = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <div></div>
  <script type="module">
    ${previewJs}
    ;window.panda = {
      css,
      cva,
      cx,
      token,
      ${patternNames.map((name) => `${name},`).join('\n')}
    };
  </script>
</body>
</html>`

  return (
    <Flex px="6" py="4" flex="1" align="stretch">
      <Frame
        key={initialContent}
        initialContent={initialContent}
        head={<style>{previewCss}</style>}
        width="100%"
        allow="none"
      >
        <FrameContextConsumer>
          {({ window }) => (
            <LiveProvider
              code={source
                .replaceAll(/import.*/g, '')
                .replaceAll(/export /g, '')
                .concat('\nrender(<App />)')}
              scope={(window as any)?.panda}
              noInline
            >
              <LiveError />
              <LivePreview />
            </LiveProvider>
          )}
        </FrameContextConsumer>
      </Frame>
    </Flex>
  )
}
