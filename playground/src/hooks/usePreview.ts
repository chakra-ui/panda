import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export type PreviewProps = {
  previewCss?: string
  previewJs?: string
  source: string
  patternNames: string[]
  patternJsxNames: string[]
  recipeNames: string[]
  isResponsive: boolean
}

export function usePreview(props: PreviewProps) {
  const { previewJs = '', patternNames, patternJsxNames, recipeNames } = props

  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (contentRef?.contentDocument) {
      contentRef.addEventListener('DOMContentLoaded', handleLoad)
    }

    return () => {
      setIsMounted(false)
      contentRef?.removeEventListener('DOMContentLoaded', handleLoad)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef])

  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!contentRef?.contentDocument || !resolvedTheme) return

    const sender = () => {
      contentRef?.contentWindow?.postMessage({ colorMode: resolvedTheme }, '*')
    }

    sender()

    const listener = window.addEventListener('message', function (event) {
      if (event.data.action === 'getColorMode') {
        sender()
      }
    })

    return () => {
      window.removeEventListener('message', listener as any)
    }
  }, [resolvedTheme, contentRef])

  const handleLoad = () => {
    clearInterval(loadCheck)
    // Bail update as some browsers will trigger on both DOMContentLoaded & onLoad ala firefox
    if (!iframeLoaded) {
      setIframeLoaded(true)
    }
  }

  // In certain situations on a cold cache DOMContentLoaded never gets called
  // fallback to an interval to check if that's the case
  const loadCheck = setInterval(() => {
    handleLoad()
  }, 500)

  const isReady = isMounted && !!contentRef?.contentDocument

  const srcDoc = `<!DOCTYPE html>
  <html>
  <head>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script> 
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script> 

    <script type="module">
    const { forwardRef, createElement } = React;
    function useMemo(fn) {
      return fn()
    }

    ${previewJs}
    ;window.panda = {
      css,
      cva,
      cx,
      token,
      ${patternJsxNames.length ? 'styled,' : ''}
      ${patternNames.map((name) => `${name},`).join('\n')}
      ${patternJsxNames.map((name) => `${name},`).join('\n')}
      ${recipeNames.map((name) => `${name},`).join('\n')}
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

  return { handleLoad, contentRef, setContentRef, iframeLoaded, isReady, srcDoc }
}
