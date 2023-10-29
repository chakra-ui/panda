import {
  SandpackProvider as BaseSandpackProvider,
  SandpackFiles,
} from '@codesandbox/sandpack-react'
import { useTheme } from 'next-themes'

import { UsePanda } from '@/hooks/use-panda'
import { css } from 'styled-system/css'

type SandpackProps = {
  children?: React.ReactNode
  code: string
  config: string
  panda: UsePanda
}

export const SandpackProvider = ({
  children,
  code,
  config,
  panda,
}: SandpackProps) => {
  const theme = useTheme()

  const files = {} as SandpackFiles
  panda.artifacts.forEach((artifact) => {
    if (!artifact) return
    const dirPath = (artifact?.dir ?? ['node_modules', 'styled-system']).join(
      '/'
    )
    artifact.files.forEach((content) => {
      if (!content.code) return
      const path = dirPath + '/' + content.file
      files[path] = {
        code: content.code,
        readOnly: true,
      }
    })
  })

  return (
    <BaseSandpackProvider
      className={css({
        flex: '1',
        fontFamily: '"Inter", sans-serif',
        lineHeight: 'inherit!',
      })}
      style={
        {
          '--sp-font-size': '16px',
          '--sp-font-family': '"Inter", sans-serif',
          colorScheme: 'inherit',
        } as any
      }
      // TODO update sandpack react + react-vite
      template='react-ts'
      theme={(theme.resolvedTheme as 'light' | 'dark') ?? 'auto'}
      customSetup={{
        dependencies: {
          // TODO import it from local files
          '@pandacss/dev': 'latest',
        },
      }}
      files={{
        ...files,
        '/App.tsx': code,
        '/theme.ts': config,
        '/styles.css': panda.previewCss,
        '/playground.css': {
          hidden: true,
          code: `
          #root {
             height: 100dvh;
          }
          `,
        },
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

const indexCode = `
import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App'
import "./styles.css"
import "./playground.css"

const ColorModeScript = () => {
  React.useEffect(() => {
    window.parent.postMessage({action:"getColorMode"},"*");
    window.addEventListener("message", function (e) {
      e.data.colorMode &&
        (function (e) {
          switch (e) {
            case "light":
              document.querySelector("html").classList.add("light"),
                document.querySelector("html").classList.remove("dark");
              break;
            case "dark":
              document.querySelector("html").classList.add("dark"),
                document.querySelector("html").classList.remove("light");
          }
        })(e.data.colorMode);
    });
  }, [])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript />
    <App />
  </React.StrictMode>
);`
