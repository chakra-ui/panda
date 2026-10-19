'use client'

import { AppToastProvider } from '@/src/components/ToastProvider'
import { ThemeProvider } from 'next-themes'
import { PropsWithChildren } from 'react'

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <AppToastProvider>{children}</AppToastProvider>
    </ThemeProvider>
  )
}
