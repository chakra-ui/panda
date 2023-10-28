import { Box } from '@chakra-ui/react'
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
} from '@codesandbox/sandpack-react'
import { CopyButton } from './copy-button'
import { EditorTabs } from './editor-tabs'

export const SandpackEditor = () => {
  return (
    <>
      <Box
        as={SandpackLayout}
        sx={{
          position: 'relative',
          '--sp-layout-height': 'auto',
          '--sp-colors-disabled': 'colors.gray.700',
          '--sp-syntax-fontStyle-keyword': 'normal',
          '--sp-syntax-fontStyle-property': 'normal',
          '.cm-lineNumbers': { fontSize: 'sm!' },
        }}
        flexDirection={{ base: 'column', md: 'row' }}
        height='full'
      >
        <Box
          as='span'
          flex='1'
          height='100%'
          maxWidth={{ base: '100%', md: '60%' }}
          position='relative'
          className='group'
          sx={{
            '.cm-scroller': {
              '&::-webkit-scrollbar': {
                height: '8px',
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.3)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'whiteAlpha.300',
              },
            },
          }}
        >
          <EditorTabs />
          <SandpackCodeEditor
            showRunButton={false}
            showLineNumbers
            showTabs={false}
            style={{ height: '100%' }}
          />
          <CopyButton />
        </Box>
        <Box
          as={SandpackPreview}
          minHeight='350px'
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
        />
      </Box>
    </>
  )
}
