'use client'
import { css } from '@/design-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { Editor, EditorProps } from './Editor'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'

type PlaygroundProps = EditorProps

export const Playground = (props: PlaygroundProps) => (
  <>
    <Toolbar />
    <Splitter
      size={[
        { id: 'editor', size: 50 },
        { id: 'preview', size: 50 },
      ]}
      className={css({ flex: '1' })}
    >
      <SplitterPanel id="editor">
        <Editor {...props} />
      </SplitterPanel>
      <SplitterResizeTrigger id="editor:preview">
        <div className={css({ background: 'gray.300', width: '1px' })} />
      </SplitterResizeTrigger>
      <SplitterPanel id="preview">
        <Preview />
      </SplitterPanel>
    </Splitter>
  </>
)
