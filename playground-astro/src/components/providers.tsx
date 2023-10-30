import { ThemeProvider } from 'next-themes'
import { AppToastProvider } from './ui/toast-provider'
import { Playground } from './playground'

export const Providers = () => {
  return (
    <ThemeProvider attribute='class' enableSystem={false} defaultTheme='dark'>
      <AppToastProvider>
        <Playground />
      </AppToastProvider>
    </ThemeProvider>
  )
}
