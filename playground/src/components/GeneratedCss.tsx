import { defaultEditorOptions } from '@/src/hooks/useEditor'
import { css } from '@/styled-system/css'
import { Stack } from '@/styled-system/jsx'
import { SegmentGroup } from '@ark-ui/react'
import MonacoEditor from '@monaco-editor/react'
import prettier from 'prettier'
import parserBabel from 'prettier/parser-babel'
import parserHtml from 'prettier/parser-html'
import parserPostCSS from 'prettier/parser-postcss'
import { useState } from 'react'
import { useReadLocalStorage } from 'usehooks-ts'
import { CssFileArtifact } from '../hooks/usePanda'

export const GeneratedCss = ({ cssArtifacts, visible }: { cssArtifacts: CssFileArtifact[]; visible: boolean }) => {
  const [activeTab, setActiveTab] = useState(cssArtifacts[0]?.file ?? 'styles.css')

  const wordWrap = useReadLocalStorage<'off' | 'on' | undefined>('wordWrap') ?? undefined

  const content = cssArtifacts.find((file) => file.file === activeTab)?.code ?? ''

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

  return (
    <Stack
      h="full"
      overflow="auto"
      hidden={!visible}
      css={{
        '&[hidden]': { display: 'none ' },
      }}
    >
      <SegmentGroup.Root
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
        onValueChange={(e) => setActiveTab(e.value as any)}
      >
        <SegmentGroup.Indicator
          data-expanded={visible ? '' : undefined}
          className={css({
            background: { base: 'transparent', _expanded: 'primary' },
            zIndex: '1',
            boxShadow: 'xs',
            borderRadius: 'xl',
            width: 'var(--width)',
            height: 'var(--height)',
            top: 'var(--top)',
            left: 'var(--left)',
          })}
        />
        {cssArtifacts.map((artifact) => (
          <SegmentGroup.Item
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
            <SegmentGroup.ItemText
              className={css({
                alignSelf: 'center',
                textStyle: 'sm',
                fontWeight: 'medium',
                color: { base: 'text.default', _dark: 'white', _checked: 'black' },
                transition: 'color 170ms ease-in-out',
              })}
            >
              {artifact.file === 'index.css' ? artifact.dir?.slice(1).concat(artifact.file)?.join('/') : artifact.file}
            </SegmentGroup.ItemText>
            <SegmentGroup.ItemControl />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>

      <MonacoEditor
        value={formatCode(content)}
        language="css"
        path={activeTab}
        options={{ ...defaultEditorOptions, readOnly: true, wordWrap }}
      />
    </Stack>
  )
}
