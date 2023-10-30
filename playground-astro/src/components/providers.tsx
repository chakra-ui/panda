import { ThemeProvider } from 'next-themes'
import { AppToastProvider } from './ui/toast-provider'
import type { PropsWithChildren } from 'react'

export const Providers = (props: PropsWithChildren) => {
  return (
    <ThemeProvider attribute='class' enableSystem={false} defaultTheme='dark'>
      <AppToastProvider>{props.children}</AppToastProvider>
    </ThemeProvider>
  )
}
