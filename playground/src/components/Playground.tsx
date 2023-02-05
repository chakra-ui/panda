'use client'
import { css } from '@/design-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { useState } from 'react'
import { Editor, EditorProps } from './Editor'
import { Layout, LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'

type PlaygroundProps = EditorProps

export const Playground = (props: PlaygroundProps) => {
  const [layout, setLayout] = useState<Layout>('horizontal')
  return (
    <>
      <Toolbar>
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
          <Editor {...props} />
        </SplitterPanel>
        <SplitterResizeTrigger id="editor:preview">
          <div className={css({ background: 'gray.300', minWidth: '1px', minHeight: '1px' })} />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview">
          <Preview />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
