'use client'
import { usePanda } from '@/src/hooks/usePanda'
import { css } from '@/styled-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { Editor } from './Editor'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { UsePlayGroundProps, usePlayground } from '@/src/hooks/usePlayground'
import { ColorModeSwitch } from '@/src/components/ColorModeSwitch'
import { ArtifactsPanel } from '@/src/components/ArtifactsPanel'

export const Playground = (props: UsePlayGroundProps) => {
  const { layout, setLayout, isPristine, state, setState, share, isSharing } = usePlayground(props)
  const panda = usePanda(state.code, state.config)
  const { previewCss, previewJs, artifacts, patternNames } = panda

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
            color: { _dark: 'black' },
            _disabled: {
              opacity: 0.5,
              cursor: 'not-allowed',
            },
            cursor: 'pointer',
          })}
          onClick={share}
          disabled={isPristine || isSharing}
        >
          {isSharing ? 'Saving...' : 'Share'}
        </button>
        <LayoutControl value={layout} onChange={setLayout} />
        <ColorModeSwitch />
      </Toolbar>
      <Splitter
        size={[
          { id: 'left', size: 50 },
          { id: 'preview', size: 50 },
        ]}
        orientation={layout}
        className={css({ flex: '1' })}
      >
        <SplitterPanel id="left" className={css({ display: 'flex', alignItems: 'stretch' })}>
          <Splitter
            size={[
              { id: 'editor', size: 50, minSize: 5 },
              { id: 'artifacts', size: 50 },
            ]}
            orientation="vertical"
          >
            <SplitterPanel id="editor" className={css({ display: 'flex', alignItems: 'stretch' /*  minH: '12' */ })}>
              <Editor value={state} onChange={setState} artifacts={artifacts} />
            </SplitterPanel>

            <ArtifactsPanel panda={panda} />
          </Splitter>
        </SplitterPanel>
        <SplitterResizeTrigger id="left:preview" asChild>
          <div className={css({ background: 'border.default', minWidth: '1px', minHeight: '1px' })} />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview" className={css({ display: 'flex', flex: 'auto' })}>
          <Preview source={state.code} previewCss={previewCss} previewJs={previewJs} patternNames={patternNames} />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
