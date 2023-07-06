import { useEffect, useState } from 'react'

export function usePreview() {
  const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null)

  const doc = contentRef?.contentDocument

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
  }, [contentRef])

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

  const isReady = isMounted && !!doc

  return { handleLoad, doc, contentRef, setContentRef, iframeLoaded, isReady }
}
