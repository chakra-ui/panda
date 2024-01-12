'use client'

import { AppToastProvider } from '@/src/components/ToastProvider'
import { ThemeProvider } from 'next-themes'
import { PropsWithChildren, useEffect, useState } from 'react'

export function Providers({ children }: PropsWithChildren) {
  const [hasWasm, setHasWasm] = useState(false)
  useEffect(() => {
    const initWasm = async () => {
      const lightningcssWasm = await import('lightningcss-wasm')
      await lightningcssWasm.default()
      setHasWasm(true)
    }
    initWasm()
  }, [])

  // client-side + lightningcss-wasm isn't loaded yet
  if (typeof window !== 'undefined' && !hasWasm) {
    return null
  }

  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <AppToastProvider>{children}</AppToastProvider>
    </ThemeProvider>
  )
}
