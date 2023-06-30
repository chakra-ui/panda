import Frame, { FrameContextConsumer } from 'react-frame-component'
import { LiveProvider, LiveError, LivePreview } from 'react-live-runner'
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

  const defaultExportName = extractDefaultExportedFunctionName(source) ?? 'App'
  const transformed = source
    .replaceAll(/import.*/g, '')
    .replaceAll(/export default /g, '')
    .replaceAll(/export /g, '')
    .concat(`\nrender(<${defaultExportName} />)`)

  return (
    <Flex px="6" py="4" align="stretch" h="full">
      <Frame
        key={initialContent}
        initialContent={initialContent}
        head={<style>{previewCss}</style>}
        width="100%"
        allow="none"
      >
        <FrameContextConsumer>
          {({ window }) => (
            <LiveProvider code={transformed} scope={(window as any)?.panda}>
              <LiveError />
              <LivePreview />
            </LiveProvider>
          )}
        </FrameContextConsumer>
      </Frame>
    </Flex>
  )
}

const defaultFunctionRegex = /export\s+default\s+function\s+(\w+)/
function extractDefaultExportedFunctionName(code: string) {
  const match = code.match(defaultFunctionRegex)
  if (match && match[1]) {
    return match[1]
  } else {
    return extractDefaultArrowFunctionName(code)
  }
}

const defaultArrowFnIdentifierRegex = /export\s+default\s+(\w+)/
function extractDefaultArrowFunctionName(code: string) {
  const match = code.match(defaultArrowFnIdentifierRegex)
  if (match && match[1]) {
    return match[1]
  } else {
    return null // Default function name not found
  }
}
