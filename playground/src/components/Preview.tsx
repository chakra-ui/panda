import { LiveProvider, LiveError, useLiveContext } from 'react-live-runner'
import { useIsClient } from 'usehooks-ts'
import { useTheme } from 'next-themes'
import { ReactEventHandler, useReducer, useState } from 'react'
import { createPortal } from 'react-dom'

export type PreviewProps = {
  previewCss?: string
  previewJs?: string
  source: string
  patternNames: string[]
}
export const Preview = ({ previewCss = '', previewJs = '', patternNames, source }: PreviewProps) => {
  const isClient = useIsClient()
  const { resolvedTheme } = useTheme()
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)
  const doc = contentRef?.contentWindow?.document
  const mountNode = doc?.body
  const insertionPoint = doc?.head

  const [, forceUpdate] = useReducer((x) => x + 1, 0)
  const updateFrame: ReactEventHandler<HTMLIFrameElement> = () => {
    //*Reload Iframe on every rerender
    forceUpdate()
  }

  // prevent false positive for server-side rendering
  if (!isClient) {
    return null
  }

  const srcDoc = `<!DOCTYPE html>
  <html>
  <head>
  <style>
  ${previewCss}
  </style>
  <script>
    window.__theme = '${resolvedTheme}'
    !function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=window.__theme;if(e){c.add(e|| '')}else{c.add('dark');}if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'dark'}catch(t){}}();
  </script>
  
  <style>
    *{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}
    </style>

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
  </head>
  <body>
  
  </body>
  </html>`

  const defaultExportName = extractDefaultExportedFunctionName(source) ?? 'App'
  const transformed = source
    .replaceAll(/import.*/g, '')
    .replaceAll(/export default /g, '')
    .replaceAll(/export /g, '')
    .concat(`\nrender(<${defaultExportName} />)`)

  return (
    <iframe key={srcDoc} srcDoc={srcDoc} ref={setContentRef} allow="none" width="100%" onLoad={updateFrame}>
      {insertionPoint &&
        mountNode &&
        createPortal(
          <LiveProvider code={transformed} scope={(contentRef?.contentWindow as any)?.panda}>
            <LiveError />
            <LivePreview />
          </LiveProvider>,
          mountNode,
        )}
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
