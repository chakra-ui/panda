'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="docs-theme"
      disableTransitionOnChange={true}
    >
      {children}
    </ThemeProvider>
  )
}
