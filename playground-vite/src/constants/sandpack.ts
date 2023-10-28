export const defaultCode = `
import { Button } from '@chakra-ui/react'

export const App = () => {
  return <Button>Click on me!</Button>
}
`.trim()

export const indexCode = `
import React from 'react'
import ReactDOM from 'react-dom'
import { ChakraProvider } from '@chakra-ui/react'

import { theme } from './theme'
import { App } from './App'

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
`.trim()

export const themeCode = `
import { extendTheme } from '@chakra-ui/react'

export const theme = extendTheme({})
`.trim()

export const FILES_TO_EXCLUDE = [
  '/tsconfig.json',
  '/styles.css',
  '/public/index.html',
  '/package.json',
]
