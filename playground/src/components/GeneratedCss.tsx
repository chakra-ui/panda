import { css } from '@/styled-system/css'
import { panda, Stack } from '@/styled-system/jsx'
import { TabIndicator, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import MonacoEditor from '@monaco-editor/react'
import { useState } from 'react'
import { CssFileArtifact } from '../hooks/usePanda'

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  readOnly: true,
  quickSuggestions: {
    strings: true,
    other: true,
    comments: true,
  },
}
export const GeneratedCss = ({ cssArtifacts }: { cssArtifacts: CssFileArtifact[] }) => {
  const [activeTab, setActiveTab] = useState(cssArtifacts[0]?.file ?? 'styles.css')
  const content = cssArtifacts.find((file) => file.file === activeTab)?.code ?? ''

  return (
    <Stack h="full" overflow="auto">
      <Tabs
        defaultValue={activeTab}
        className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}
        onChange={(e) => setActiveTab(e.value!)}
      >
        <TabList
          className={css({
            px: '6',
            borderBottomWidth: '1px',
            borderBottomColor: 'border.default',
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'auto',
            maxW: 'full',
            gap: '3',
            '& button': {
              py: '3',
              bg: 'transparent',
              fontWeight: 'medium',
              color: { base: 'gray.500', _dark: 'gray.400' },
              _selected: {
                color: { base: 'gray.900', _dark: 'white' },
              },
            },
          })}
        >
          {cssArtifacts.map((artifact) => (
            <TabTrigger key={artifact.file} value={artifact.file} asChild>
              <panda.button whiteSpace="nowrap" fontSize="sm">
                {artifact.file === 'index.css'
                  ? artifact.dir?.slice(1).concat(artifact.file)?.join('/')
                  : artifact.file}
              </panda.button>
            </TabTrigger>
          ))}
          <TabIndicator className={css({ background: 'yellow.400', height: '2px', mb: '-1px' })} />
        </TabList>
      </Tabs>
      <MonacoEditor path={activeTab} value={content} language="css" options={editorOptions} />
    </Stack>
  )
}
