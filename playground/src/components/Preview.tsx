import { LiveProvider, LiveError, useLiveContext } from 'react-live-runner'
import { useIsClient } from 'usehooks-ts'
import { createPortal } from 'react-dom'
import { usePreview } from '@/src/hooks/usePreview'

export type PreviewProps = {
  previewCss?: string
  previewJs?: string
  source: string
  patternNames: string[]
}
export const Preview = ({ previewCss = '', previewJs = '', patternNames, source }: PreviewProps) => {
  const isClient = useIsClient()

  const { handleLoad, contentRef, setContentRef, iframeLoaded, isReady } = usePreview()

  const srcDoc = `<!DOCTYPE html>
  <html>
  <head>
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

  <script type="module">

  //* This is just listening for the color mode change event and applying the class to the html element
  window.parent.postMessage({action:"getColorMode"},"*"),window.addEventListener("message",(function(e){e.data.colorMode&&function(e){switch(e){case"light":document.querySelector("html").classList.add("light"),document.querySelector("html").classList.remove("dark");break;case"dark":document.querySelector("html").classList.add("dark"),document.querySelector("html").classList.remove("light")}}(e.data.colorMode)}));

</script>

  </head>
  <body>
  
  </body>
  </html>`

  // prevent false positive for server-side rendering
  if (!isClient) {
    return null
  }

  function renderContent() {
    if (!isReady) {
      return null
    }

    const contents = (
      <LiveProvider code={transformed} scope={(contentRef?.contentWindow as any)?.panda}>
        <LiveError />
        <LivePreview />
      </LiveProvider>
    )

    const doc = contentRef?.contentDocument

    return [
      doc?.head && createPortal(<style>{previewCss}</style>, doc.head),
      doc?.body && createPortal(contents, doc.body),
    ]
  }

  const defaultExportName = extractDefaultExportedFunctionName(source) ?? 'App'
  const transformed = source
    .replaceAll(/import.*/g, '')
    .replaceAll(/export default /g, '')
    .replaceAll(/export /g, '')
    .concat(`\nrender(<${defaultExportName} />)`)

  return (
    <iframe srcDoc={srcDoc} ref={setContentRef} allow="none" width="100%" onLoad={handleLoad}>
      {iframeLoaded && renderContent()}
    </iframe>
  )
}

function LivePreview() {
  const { element } = useLiveContext()

  return element
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
