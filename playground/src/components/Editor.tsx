import { FormatCode, WrapText } from '@/src/components/icons'
import { css, cva, cx } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { segmentGroup } from '@/styled-system/recipes'
import { Segment, SegmentControl, SegmentGroup, SegmentGroupIndicator, SegmentLabel } from '@ark-ui/react'
import MonacoEditor, { DiffEditor } from '@monaco-editor/react'
import { PandaEditorProps, defaultEditorOptions, useEditor } from '../hooks/useEditor'

const tabs = [
  {
    id: 'code',
    label: 'Code',
  },
  {
    id: 'css',
    label: 'CSS',
  },
  {
    id: 'config',
    label: 'Config',
  },
]

export const Editor = (props: PandaEditorProps) => {
  const {
    activeTab,
    setActiveTab,
    onBeforeMount,
    onCodeEditorChange,
    onCodeEditorMount,
    onCodeEditorFormat,
    wordWrap,
    onToggleWrap,
  } = useEditor(props)

  const editorPaths = {
    code: 'code.tsx',
    css: 'custom.css',
    config: 'config.ts',
  }

  return (
    <Flex flex="1" direction="column" align="flex-start" minW="0">
      <div className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <SegmentGroup
          className={cx(
            segmentGroup(),
            css({
              borderBottomWidth: '1px',
              pl: '6',
              pr: '4',
            }),
          )}
          value={activeTab}
          onChange={(e) => setActiveTab(e.value as any)}
        >
          <SegmentGroupIndicator />
          {tabs.map((option, id) => (
            <Segment key={id} value={option.id} aria-label={option.label}>
              <SegmentLabel
                className={css({
                  px: 2,
                })}
              >
                {option.label}
              </SegmentLabel>
              <SegmentControl />
            </Segment>
          ))}

          <div className={css({ ml: 'auto', display: 'flex', gap: '0.5' })}>
            <button
              className={actionButton()}
              title="Toggle word wrap (Alt + Z)"
              data-active={wordWrap === 'on' ? '' : undefined}
              onClick={onToggleWrap}
            >
              <WrapText />
            </button>
            <button
              className={actionButton()}
              title="Format code (Shift + Alt + F)"
              disabled={!!props.diffState}
              onClick={onCodeEditorFormat}
            >
              <FormatCode />
            </button>
          </div>
        </SegmentGroup>
        <div className={cx(css({ flex: '1', pt: '2' }), editorTokenizer())}>
          {props.diffState ? (
            <DiffEditor
              original={props.value[activeTab]}
              modified={props.diffState[activeTab]}
              language={activeTab === 'css' ? 'css' : 'typescript'}
              originalModelPath={editorPaths[activeTab]}
              modifiedModelPath={'modified-' + editorPaths[activeTab]}
              options={{ ...defaultEditorOptions, renderSideBySide: false, readOnly: true }}
              beforeMount={onBeforeMount}
              onMount={(editor, monaco) => onCodeEditorMount(editor.getModifiedEditor(), monaco)}
            />
          ) : (
            <MonacoEditor
              value={props.value[activeTab]}
              language={activeTab === 'css' ? 'css' : 'typescript'}
              path={editorPaths[activeTab]}
              options={defaultEditorOptions}
              beforeMount={onBeforeMount}
              onMount={onCodeEditorMount}
              onChange={onCodeEditorChange}
            />
          )}
        </div>
      </div>
    </Flex>
  )
}

const actionButton = cva({
  base: {
    borderRadius: 'sm',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    h: '8',
    w: '8',
    '& > svg': { h: '5' },
    color: 'text.default',
    transition: 'all 0.2s ease-in-out',
    '&:hover, &[data-active]': {
      color: { base: 'gray.700', _dark: 'gray.100' },
      bg: { base: 'gray.100', _dark: '#3A3A3AFF' },
    },
    _disabled: { cursor: 'not-allowed' },
  },
})

const editorTokenizer = cva({
  base: {
    '& .jsx-expression-braces, & .bracket-highlighting-0, & .bracket-highlighting-4': {
      color: { _dark: '#A89984!' },
    },
    '& .bracket-highlighting-1, & .bracket-highlighting-3': {
      color: { _dark: '#EBDBB2!' },
    },
    '& .jsx-tag-angle-bracket': {
      color: { base: '#000000!', _dark: '#83A598!' },
    },
    '& .jsx-tag-name': {
      color: { base: '#22863a!', _dark: '#8EC07C!' },
    },
    '& .jsx-tag-attribute-key, & .jsx-expression-braces + :not(.jsx-tag-angle-bracket):not(.bracket-highlighting-3)': {
      color: { base: '#6f42c1!', _dark: '#FABD2F!' },
    },
    '& .jsx-text': {
      color: { base: '#000000!', _dark: '#EBDBB2!' },
    },
  },
})
