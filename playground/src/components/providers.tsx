'use client'

import { AppToastProvider } from '@/src/components/ToastProvider'
import init from 'lightningcss-wasm'
import { ThemeProvider } from 'next-themes'
import { PropsWithChildren, useEffect, useState } from 'react'

export function Providers({ children }: PropsWithChildren) {
  const [hasWasm, setHasWasm] = useState(false)
  useEffect(() => {
    const initWasm = async () => {
      await init()
      setHasWasm(true)
    }
    initWasm()
  }, [])

  if (!hasWasm) {
    return null
  }

  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <AppToastProvider>{children}</AppToastProvider>
    </ThemeProvider>
  )
}
