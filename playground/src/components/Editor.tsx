import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'

import MonacoEditor, { EditorProps } from '@monaco-editor/react'
import { Segment, SegmentControl, SegmentGroup, SegmentIndicator, SegmentInput, SegmentLabel } from '@ark-ui/react'

import { PandaEditorProps, useEditor } from '../hooks/useEditor'
import { Code, Palette } from './icons'
import { flex } from '@/styled-system/patterns'

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

export const Editor = (props: PandaEditorProps) => {
  const { activeTab, setActiveTab, onBeforeMount, onCodeEditorChange, onCodeEditorMount } = useEditor(props)

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <div className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <SegmentGroup
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '4',
            px: '1',
            pl: '6',
            py: '2',
            borderBottomWidth: '1px',
            borderBottomColor: 'border.default',
          })}
          value={activeTab}
          onChange={(e) => setActiveTab(e.value as any)}
        >
          <SegmentIndicator
            className={css({
              background: 'primary',
              zIndex: '0',
              boxShadow: 'xs',
              borderRadius: 'md',
            })}
          />
          {tabs.map((option, id) => (
            <Segment
              className={css({
                zIndex: '1',
                position: 'relative',
                fontWeight: 'semibold',
                color: '#FFFFFF4D',
                p: '1',
                cursor: 'pointer',
                display: 'flex',
              })}
              key={id}
              value={option.id}
              aria-label={option.label}
            >
              <SegmentLabel
                className={flex({
                  gap: '2',
                  px: '2',
                  align: 'center',
                  alignSelf: 'center',
                  color: { base: 'text.default', _checked: 'black' },
                  transition: 'color 170ms ease-in-out',
                })}
              >
                {option.icon} {option.label}
              </SegmentLabel>
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
