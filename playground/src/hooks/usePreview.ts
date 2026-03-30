import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

export function usePreview() {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const loadCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleLoad = useCallback(() => {
    if (loadCheckRef.current) {
      clearInterval(loadCheckRef.current)
      loadCheckRef.current = null
    }
    setIframeLoaded(true)
  }, [])

  useEffect(() => {
    setIsMounted(true)
    if (contentRef?.contentDocument) {
      contentRef.addEventListener('DOMContentLoaded', handleLoad)
    }

    // In certain situations on a cold cache DOMContentLoaded never gets called
    // fallback to an interval to check if that's the case
    loadCheckRef.current = setInterval(() => {
      handleLoad()
    }, 500)

    return () => {
      setIsMounted(false)
      contentRef?.removeEventListener('DOMContentLoaded', handleLoad)
      if (loadCheckRef.current) {
        clearInterval(loadCheckRef.current)
        loadCheckRef.current = null
      }
    }
  }, [contentRef, handleLoad])

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

  const isReady = isMounted && !!contentRef?.contentDocument

  const srcDoc = `<!DOCTYPE html>
  <html>
  <head>
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
