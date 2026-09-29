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

  // render nothing on the server too, so hydration matches while lightningcss-wasm loads
  if (!hasWasm) {
    return null
  }

  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <AppToastProvider>{children}</AppToastProvider>
    </ThemeProvider>
  )
}
