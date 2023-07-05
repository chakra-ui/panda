import { css, cva } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'

import MonacoEditor, { EditorProps } from '@monaco-editor/react'
import { Segment, SegmentControl, SegmentGroup, SegmentIndicator, SegmentInput, SegmentLabel } from '@ark-ui/react'

import { PandaEditorProps, useEditor } from '../hooks/useEditor'

const EDITOR_OPTIONS: EditorProps['options'] = {
  minimap: { enabled: false },
  fontSize: 14,
  quickSuggestions: {
    strings: true,
    other: true,
    comments: true,
  },
  guides: {
    indentation: false,
  },
}

const tabs = [
  {
    id: 'code',
    label: 'Code',
    icon: <Code />,
  },
  {
    id: 'config',
    label: 'Config',
    icon: <Palette />,
  },
]

const editorTabs = cva({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    px: '1',
    pl: '6',
    py: '2',
    borderBottomWidth: '1px',
    borderBottomColor: 'border.default',

    '& [data-part="indicator"]': {
      background: 'primary',
      zIndex: '1',
      boxShadow: 'xs',
      borderRadius: 'md',
    },

    '& [data-part="radio"]': {
      zIndex: '2',
      position: 'relative',
      fontWeight: 'semibold',
      color: '#FFFFFF4D',
      p: '1',
      cursor: 'pointer',
      display: 'flex',
    },

    '& [data-part="radio-label"]': {
      alignSelf: 'center',
      _checked: {
        color: 'black',
      },
    },
  },
})

export const Editor = (props: PandaEditorProps) => {
  const { activeTab, setActiveTab, onBeforeMount, onCodeEditorChange, onCodeEditorMount } = useEditor(props)

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <div className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <SegmentGroup
          className={editorTabs()}
          value={activeTab}
          onChange={(e) => (console.log(e), setActiveTab(e.value as any))}
        >
          <SegmentIndicator />
          {tabs.map((option, id) => (
            <Segment key={id} value={option.id}>
              <SegmentLabel>{option.icon}</SegmentLabel>
              <SegmentInput />
              <SegmentControl />
            </Segment>
          ))}
        </SegmentGroup>
        <div className={css({ flex: '1' })}>
          <MonacoEditor
            value={props.value[activeTab]}
            language="typescript"
            path={activeTab === 'code' ? 'code.tsx' : 'config.ts'}
            options={EDITOR_OPTIONS}
            beforeMount={onBeforeMount}
            onMount={onCodeEditorMount}
            onChange={onCodeEditorChange}
          />
        </div>
      </div>
    </Flex>
  )
}

function Code() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.4 16.6L4.8 12L9.4 7.4L8 6L2 12L8 18L9.4 16.6ZM14.6 16.6L19.2 12L14.6 7.4L16 6L22 12L16 18L14.6 16.6Z" />
    </svg>
  )
}

function Palette() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C6.49 22 2 17.51 2 12C2 6.49 6.49 2 12 2C17.51 2 22 6.04 22 11C22 14.31 19.31 17 16 17H14.23C13.95 17 13.73 17.22 13.73 17.5C13.73 17.62 13.78 17.73 13.86 17.83C14.27 18.3 14.5 18.89 14.5 19.5C14.5 20.88 13.38 22 12 22ZM12 4C7.59 4 4 7.59 4 12C4 16.41 7.59 20 12 20C12.28 20 12.5 19.78 12.5 19.5C12.5 19.34 12.42 19.22 12.36 19.15C11.95 18.69 11.73 18.1 11.73 17.5C11.73 16.12 12.85 15 14.23 15H16C18.21 15 20 13.21 20 11C20 7.14 16.41 4 12 4Z" />
      <path d="M6.5 13C7.32843 13 8 12.3284 8 11.5C8 10.6716 7.32843 10 6.5 10C5.67157 10 5 10.6716 5 11.5C5 12.3284 5.67157 13 6.5 13Z" />
      <path d="M9.5 9C10.3284 9 11 8.32843 11 7.5C11 6.67157 10.3284 6 9.5 6C8.67157 6 8 6.67157 8 7.5C8 8.32843 8.67157 9 9.5 9Z" />
      <path d="M14.5 9C15.3284 9 16 8.32843 16 7.5C16 6.67157 15.3284 6 14.5 6C13.6716 6 13 6.67157 13 7.5C13 8.32843 13.6716 9 14.5 9Z" />
      <path d="M17.5 13C18.3284 13 19 12.3284 19 11.5C19 10.6716 18.3284 10 17.5 10C16.6716 10 16 10.6716 16 11.5C16 12.3284 16.6716 13 17.5 13Z" />
    </svg>
  )
}
