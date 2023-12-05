import { FormatCode } from '@/src/components/icons'
import { css, cva, cx } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { segmentGroup } from '@/styled-system/recipes'
import { Segment, SegmentControl, SegmentGroup, SegmentGroupIndicator, SegmentLabel } from '@ark-ui/react'
import MonacoEditor from '@monaco-editor/react'
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
  const { activeTab, setActiveTab, onBeforeMount, onCodeEditorChange, onCodeEditorMount, onCodeEditorFormat } =
    useEditor(props)

  const editorPaths = {
    code: 'code.tsx',
    css: 'custom.css',
    config: 'config.ts',
  }

  return (
    <Flex flex="1" direction="column" align="flex-start">
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

          <button
            className={css({
              ml: 'auto',
              borderRadius: 'sm',
              cursor: 'pointer',
              p: '1',
              color: 'text.default',
              _hover: {
                color: { base: 'gray.700', _dark: 'gray.100' },
                bg: { base: 'gray.100', _dark: '#3A3A3AFF' },
              },
              transition: 'all 0.2s ease-in-out',
            })}
            title="Format code"
            onClick={onCodeEditorFormat}
          >
            <FormatCode />
          </button>
        </SegmentGroup>
        <div className={cx(css({ flex: '1', pt: '2' }), editorTokenizer())}>
          <MonacoEditor
            value={props.value[activeTab]}
            language={activeTab === 'css' ? 'css' : 'typescript'}
            path={editorPaths[activeTab]}
            options={defaultEditorOptions}
            beforeMount={onBeforeMount}
            onMount={onCodeEditorMount}
            onChange={onCodeEditorChange}
          />
        </div>
      </div>
    </Flex>
  )
}

const editorTokenizer = cva({
  base: {
    '& .JSXElement.JSXBracket, & .JSXOpeningFragment.JSXBracket, & .JSXClosingFragment.JSXBracket': {
      color: { base: '#000000!', _dark: '#83A598!' },
    },
    '& .bracket-highlighting-1, & .bracket-highlighting-3': {
      color: { _dark: '#EBDBB2!' },
    },
    '& .JSXElement.JSXIdentifier, & .JSXAttribute.JSXIdentifier + *': {
      color: { base: '#22863a!', _dark: '#8EC07C!' },
    },
    '& .JSXAttribute.JSXIdentifier, & .JSXExpressionContainer.JSXBracket + :not(.bracket-highlighting-3):not(.JSXElement)':
      {
        color: { base: '#6f42c1!', _dark: '#FABD2F!' },
      },
    '& .JSXExpressionContainer.JSXBracket, & .bracket-highlighting-0': {
      color: { _dark: '#A89984!' },
    },
    '& .bracket-highlighting-0, & .bracket-highlighting-4': {
      color: { _dark: '#A89984!' },
    },
    '& .JSXElement.JSXText': {
      color: { base: '#000000!', _dark: '#EBDBB2!' },
    },
    '& .JSXClosingFragment.JSXBracket, & .JSXOpeningElement.JSXBracket, & .JSXOpeningFragment.JSXBracket': {
      fontWeight: 'normal!',
    },
  },
})
