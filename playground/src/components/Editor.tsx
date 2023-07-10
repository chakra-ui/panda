import { css, cx } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { segmentGroup } from '@/styled-system/recipes'

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
  },
  {
    id: 'config',
    label: 'Config',
  },
]

export const Editor = (props: PandaEditorProps) => {
  const { activeTab, setActiveTab, onBeforeMount, onCodeEditorChange, onCodeEditorMount } = useEditor(props)

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <div className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <SegmentGroup
          className={cx(
            segmentGroup(),
            css({
              pl: '6',
              borderBottomWidth: '1px',
            }),
          )}
          value={activeTab}
          onChange={(e) => setActiveTab(e.value as any)}
        >
          <SegmentIndicator />
          {tabs.map((option, id) => (
            <Segment key={id} value={option.id} aria-label={option.label}>
              <SegmentLabel
                className={css({
                  px: 2,
                })}
              >
                {option.label}
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
