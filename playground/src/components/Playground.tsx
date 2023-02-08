'use client'
import { css } from '@/design-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { config } from '@pandacss/presets'
import { Editor } from './Editor'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { usePlayground, UsePlayGroundProps } from './usePlayground'
import { usePanda } from '@/src/components/usePanda'

export const Playground = (props: UsePlayGroundProps) => {
  const { layout, setLayout, isPristine, state, setState, share } = usePlayground(props)
  const { previewCss, previewJs, artifacts, patternNames } = usePanda(state.code, config)

  return (
    <>
      <Toolbar>
        <button
          className={css({
            py: '2',
            px: '4',
            borderRadius: 'lg',
            fontWeight: 'semibold',
            bg: 'yellow.300',
            _disabled: {
              bg: 'yellow.100',
            },
          })}
          onClick={share}
          disabled={isPristine}
        >
          Share
        </button>
        <LayoutControl value={layout} onChange={setLayout} />
      </Toolbar>
      <Splitter
        size={[
          { id: 'editor', size: 50 },
          { id: 'preview', size: 50 },
        ]}
        orientation={layout}
        className={css({ flex: '1' })}
      >
        <SplitterPanel id="editor" className={css({ display: 'flex', alignItems: 'stretch' })}>
          <Editor value={state} onChange={setState} artifacts={artifacts} />
        </SplitterPanel>
        <SplitterResizeTrigger id="editor:preview">
          <div className={css({ background: 'gray.300', minWidth: '1px', minHeight: '1px' })} />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview" className={css({ display: 'flex', alignItems: 'stretch' })}>
          <Preview source={state.code} previewCss={previewCss} previewJs={previewJs} patternNames={patternNames} />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
