import Frame, { FrameContextConsumer } from 'react-frame-component'
import { LiveProvider, LiveError, LivePreview } from 'react-live-runner'
import { useIsClient } from 'usehooks-ts'
import { useTheme } from 'next-themes'

export type PreviewProps = {
  previewCss?: string
  previewJs?: string
  source: string
  patternNames: string[]
}
export const Preview = ({ previewCss = '', previewJs = '', patternNames, source }: PreviewProps) => {
  const isClient = useIsClient()
  const { resolvedTheme } = useTheme()
  // prevent false positive for server-side rendering
  if (!isClient) {
    return null
  }

  const initialContent = `<!DOCTYPE html>
<html>
<head>
<script>
  window.__theme = '${resolvedTheme}'
  !function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=window.__theme;if(e){c.add(e|| '')}else{c.add('dark');}if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'dark'}catch(t){}}();
</script>

<style>
  *{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}
  </style>
</head>
<body>

  <div style="height: 100%;"></div>
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
            <LivePreview style={{ height: '100%' }} />
          </LiveProvider>
        )}
      </FrameContextConsumer>
    </Frame>
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
