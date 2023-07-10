import { css } from '@/styled-system/css'
import { Stack } from '@/styled-system/jsx'
import { Segment, SegmentControl, SegmentGroup, SegmentIndicator, SegmentInput, SegmentLabel } from '@ark-ui/react'
import MonacoEditor, { EditorProps } from '@monaco-editor/react'
import { useState, useRef, useEffect } from 'react'
import { CssFileArtifact } from '../hooks/usePanda'
import { OnMount, BeforeMount } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { pandaTheme } from '../lib/gruvbox-theme'

import prettier from 'prettier'
import parserBabel from 'prettier/parser-babel'
import parserHtml from 'prettier/parser-html'
import parserPostCSS from 'prettier/parser-postcss'

const EDITOR_OPTIONS: EditorProps['options'] = {
  minimap: { enabled: false },
  fontSize: 14,
  readOnly: true,
  quickSuggestions: {
    strings: true,
    other: true,
    comments: true,
  },
  guides: {
    indentation: false,
  },
}

export const GeneratedCss = ({ cssArtifacts, visible }: { cssArtifacts: CssFileArtifact[]; visible: boolean }) => {
  const [activeTab, setActiveTab] = useState(cssArtifacts[0]?.file ?? 'styles.css')
  const { resolvedTheme } = useTheme()

  const content = cssArtifacts.find((file) => file.file === activeTab)?.code ?? ''

  const monacoRef = useRef<Parameters<OnMount>[1]>()

  useEffect(() => {
    monacoRef.current?.editor.setTheme(resolvedTheme === 'dark' ? 'panda-dark' : 'vs')
  }, [monacoRef, resolvedTheme])

  const onBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('panda-dark', pandaTheme)
  }

  const formatCode = (code: string) => {
    try {
      return prettier.format(code, {
        parser: 'css',
        plugins: [parserHtml, parserBabel, parserPostCSS],
      })
    } catch (e) {
      console.log('e', e)
      return code
    }
  }

  const onCodeEditorMount: OnMount = (editor, monaco) => {
    if (resolvedTheme === 'dark') monaco.editor.setTheme('panda-dark')
    monacoRef.current = monaco
  }

  return (
    <Stack
      h="full"
      overflow="auto"
      hidden={!visible}
      css={{
        '&[hidden]': { display: 'none ' },
      }}
    >
      <SegmentGroup
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2',
          px: '1',
          pl: '6',
          py: '2',
          borderBottomWidth: '1px',
        })}
        value={activeTab}
        onChange={(e) => (console.log(e), setActiveTab(e.value as any))}
      >
        <SegmentIndicator
          data-expanded={visible ? '' : undefined}
          className={css({
            background: { base: 'transparent', _expanded: 'primary' },
            zIndex: '1',
            boxShadow: 'xs',
            borderRadius: 'xl',
          })}
        />
        {cssArtifacts.map((artifact) => (
          <Segment
            className={css({
              zIndex: '2',
              position: 'relative',
              fontWeight: 'semibold',
              color: '#FFFFFF4D',
              px: '4',
              py: '1',
              cursor: 'pointer',
              display: 'flex',
              borderRadius: 'xl',
              bg: { _hover: 'rgba(255, 255, 255, 0.10)' },
              transition: 'background 170ms ease-in-out',
            })}
            key={artifact.file}
            value={artifact.file}
          >
            <SegmentLabel
              className={css({
                alignSelf: 'center',
                textStyle: 'xs',
                fontWeight: 'medium',
                color: { base: 'text.default', _dark: 'white', _checked: 'black' },
                transition: 'color 170ms ease-in-out',
              })}
            >
              {artifact.file === 'index.css' ? artifact.dir?.slice(1).concat(artifact.file)?.join('/') : artifact.file}
            </SegmentLabel>
            <SegmentInput />
            <SegmentControl />
          </Segment>
        ))}
      </SegmentGroup>

      <MonacoEditor
        value={formatCode(content)}
        language="css"
        path={activeTab}
        options={EDITOR_OPTIONS}
        beforeMount={onBeforeMount}
        onMount={onCodeEditorMount}
      />
    </Stack>
  )
}
