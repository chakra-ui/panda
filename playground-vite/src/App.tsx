import { Box, Button, DarkMode, Flex, HStack } from '@chakra-ui/react'
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

const App = () => {
  const [code, setCode] = useState('')
  const [searchParams] = useSearchParams()

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
      <Flex direction='column' padding='3' bg='gray.800' height='$100vh'>
        <Flex justify='space-between' align='center' mb='2' py='1'>
          <Box color='white' fontSize='3xl'>
            <Logo />
          </Box>
          <HStack color='white'>
            <ShareButton />
            <DarkMode>
              <Button
                as={UnstyledOpenInCodeSandboxButton}
                size='sm'
                leftIcon={<SiCodesandbox />}
              >
                Open in CodeSandbox
              </Button>
            </DarkMode>
          </HStack>
        </Flex>
        <SandpackEditor />
      </Flex>
    </SandpackProvider>
  )
}

export default App
