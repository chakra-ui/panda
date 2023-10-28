import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
} from '@codesandbox/sandpack-react'
import { styled } from '../../styled-system/jsx'
import { CopyButton } from './copy-button'
import { EditorTabs } from './editor-tabs'

const Layout = styled(SandpackLayout)
const Preview = styled(SandpackPreview)

export const SandpackEditor = () => {
  return (
    <>
      <Layout
        css={{
          position: 'relative',
          '--sp-layout-height': 'auto',
          '--sp-colors-disabled': 'colors.gray.700',
          '--sp-syntax-fontStyle-keyword': 'normal',
          '--sp-syntax-fontStyle-property': 'normal',
          '& .cm-lineNumbers': { fontSize: 'sm!' },
        }}
        flexDirection={{ base: 'column', md: 'row' }}
        height='full'
      >
        <styled.span
          flex='1'
          height='100%'
          maxWidth={{ base: '100%', md: '60%' }}
          position='relative'
          className='group'
          css={{
            '& .cm-scroller': {
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
        </styled.span>
        <Preview
          minHeight='350px'
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
        />
      </Layout>
    </>
  )
}
