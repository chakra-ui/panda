import { SandpackProvider as BaseSandpackProvider } from '@codesandbox/sandpack-react'
import { nightOwl } from '@codesandbox/sandpack-themes'
import { useTheme } from 'next-themes'

import { indexCode, themeCode } from '../constants/sandpack'

type SandpackProps = {
  children?: React.ReactNode
  code: string
}

export const SandpackProvider = ({ children, code }: SandpackProps) => {
  const theme = useTheme()

  return (
    <BaseSandpackProvider
      style={{ flex: '1' }}
      template='react-ts'
      theme={theme.resolvedTheme ?? 'auto'}
      // theme={{
      //   ...nightOwl,
      //   font: {
      //     ...nightOwl.font,
      //     mono: 'SF Mono, Menlo, Monaco, Consolas, monospace',
      //   },
      // }}
      customSetup={{
        dependencies: {
          '@pandacss/dev': 'latest',
        },
      }}
      files={{
        '/App.tsx': code,
        '/theme.ts': themeCode,
        '/index.tsx': {
          hidden: true,
          code: indexCode,
        },
      }}
    >
      {children}
    </BaseSandpackProvider>
  )
}
