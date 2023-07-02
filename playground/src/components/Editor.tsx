import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'

import MonacoEditor, { EditorProps } from '@monaco-editor/react'

import { PandaEditorProps, useEditor } from '../hooks/useEditor'

const EDITOR_OPTIONS: EditorProps['options'] = {
  minimap: { enabled: false },
  fontSize: 14,
  quickSuggestions: {
    strings: true,
    other: true,
    comments: true,
  },
}

export const Editor = (props: PandaEditorProps) => {
  const { activeTab, setActiveTab, onCodeEditorChange, onCodeEditorMount } = useEditor(props)

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <div className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <div
          className={css({
            px: '6',
            borderBottomWidth: '1px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3',
            '& button': {
              py: '3',
              bg: 'transparent',
              fontWeight: 'medium',
              color: 'gray.500',
              borderBottomWidth: '2px',
              borderBottomColor: 'transparent',
              cursor: 'pointer',
              _selected: {
                borderBottomColor: 'yellow.400',
                color: 'gray.900',
              },
            },
          })}
        >
          <button data-selected={activeTab === 'code' ? '' : undefined} onClick={() => setActiveTab('code')}>
            Code
          </button>
          <button data-selected={activeTab === 'config' ? '' : undefined} onClick={() => setActiveTab('config')}>
            Config
          </button>
        </div>
        <div className={css({ flex: '1', pt: '4' })}>
          <MonacoEditor
            value={props.value[activeTab]}
            language="typescript"
            path={activeTab === 'code' ? 'code.tsx' : 'config.ts'}
            options={EDITOR_OPTIONS}
            onMount={onCodeEditorMount}
            onChange={onCodeEditorChange}
          />
        </div>
      </div>
    </Flex>
  )
}
