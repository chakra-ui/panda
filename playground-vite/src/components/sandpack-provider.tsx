import { SandpackProvider as BaseSandpackProvider } from '@codesandbox/sandpack-react'
import { nightOwl } from '@codesandbox/sandpack-themes'

import { indexCode, themeCode } from '../constants/sandpack'

type SandpackProps = {
  children?: React.ReactNode
  code: string
}

export const SandpackProvider = ({ children, code }: SandpackProps) => (
  <BaseSandpackProvider
    style={{ flex: '1' }}
    template='react-ts'
    theme={{
      ...nightOwl,
      font: {
        ...nightOwl.font,
        mono: 'SF Mono, Menlo, Monaco, Consolas, monospace',
      },
    }}
    customSetup={{
      dependencies: {
        '@chakra-ui/react': 'latest',
        '@chakra-ui/icons': 'latest',
        '@chakra-ui/anatomy': 'latest',
        '@chakra-ui/styled-system': 'latest',
        '@emotion/styled': 'latest',
        '@emotion/react': 'latest',
        'framer-motion': 'latest',
        'react-icons': 'latest',
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
