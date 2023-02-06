'use client'
import { css } from '@/design-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { Editor } from './Editor'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { usePlayground, UsePlayGroundProps } from './usePlayground'
import { config } from '@pandacss/presets'

export const Playground = (props: UsePlayGroundProps) => {
  const { layout, setLayout, isPristine, state, setState, share } = usePlayground(props)

  return (
    <>
      <Toolbar>
        <button onClick={share} disabled={isPristine}>
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
        <SplitterPanel id="editor">
          <Editor value={state} onChange={setState} />
        </SplitterPanel>
        <SplitterResizeTrigger id="editor:preview">
          <div className={css({ background: 'gray.300', minWidth: '1px', minHeight: '1px' })} />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview">
          <Preview
            source={state.code}
            // @ts-expect-error Config vs. UserConfig
            config={config}
          />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
