import { UnstyledOpenInCodeSandboxButton } from '@codesandbox/sandpack-react'
import { useEffect, useState } from 'react'
import { SiCodesandbox } from 'react-icons/si'
import { useSearchParams } from 'react-router-dom'
import { Logo } from './components/logo'

import { SandpackEditor } from './components/sandpack-editor'
import { SandpackProvider } from './components/sandpack-provider'
import { ShareButton } from './components/share-button'
import { defaultCode } from './constants/sandpack'
import { decode } from './utils/encoder'
import { Flex, Box, HStack } from '../styled-system/jsx'
import { Button } from './components/button'
import { ColorModeSwitch } from './components/color-mode-switch'
import { Playground } from './components/playground'

const App = () => {
  const [code, setCode] = useState('')
  const [searchParams] = useSearchParams()

  // TODO UrlSaver
  // https://github.com/astahmer/lightningcss-ast-viewer/blob/13e0631ad12c39d4d3c06a3461218230e63042ef/src/lib/url-saver.ts
  useEffect(() => {
    const encoded = searchParams.get('code')
    let decoded

    if (encoded) {
      decoded = decode(encoded)
    }

    setCode(decoded ?? defaultCode)
  }, [])

  return (
    <SandpackProvider code={code}>
      <Playground />
      {/* <Flex
        direction='column'
        padding='3'
        bg={{ _dark: '#282828' }}
        height='100dvh'
      >
        <Flex justify='space-between' align='center' mb='2' py='1'>
          <Box color='white' fontSize='3xl'>
            <Logo />
          </Box>
          <HStack color='white'>
            <ShareButton />
            <Button
              // @ts-expect-error as prop
              as={UnstyledOpenInCodeSandboxButton}
              size='sm'
              leftIcon={<SiCodesandbox />}
            >
              Open in CodeSandbox
            </Button>
            <ColorModeSwitch />
          </HStack>
        </Flex>
        <SandpackEditor />
      </Flex> */}
    </SandpackProvider>
  )
}

export default App
