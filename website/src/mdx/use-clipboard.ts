import { useCallback, useEffect, useState } from 'react'

export function useClipboard(props: { getValue: () => string }) {
  const { getValue } = props

  const [isCopied, setCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timerId = setTimeout(() => {
      setCopied(false)
    }, 2000)

    return () => {
      clearTimeout(timerId)
    }
  }, [isCopied])

  const copy = useCallback(async () => {
    setCopied(true)

    if (!navigator?.clipboard) {
      console.error('Access to clipboard rejected!')
    }

    try {
      await navigator.clipboard.writeText(getValue())
    } catch {
      console.error('Failed to copy!')
    }
  }, [getValue])

  return { isCopied, copy }
}
