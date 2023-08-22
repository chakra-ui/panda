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
import { splitter } from '@/styled-system/recipes'

export const Playground = (props: UsePlayGroundProps) => {
  const {
    layout,
    layoutValue,
    isPreviewMode,
    panels,
    onResizePanels,
    switchLayout,
    isPristine,
    state,
    setState,
    onShare,
    isSharing,
    isResponsive,
  } = usePlayground(props)
  const panda = usePanda(state.code, state.config)
  const { artifacts } = panda

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
          onClick={onShare}
          disabled={isPristine || isSharing}
        >
          {isSharing ? 'Saving...' : 'Share'}
        </button>
        <LayoutControl value={layoutValue} onChange={switchLayout} isResponsive={isResponsive} />
        <ColorModeSwitch />
      </Toolbar>
      <Splitter size={panels} onResize={onResizePanels} orientation={layout} className={splitter()}>
        <SplitterPanel id="left">
          <Splitter
            size={[
              { id: 'editor', size: 50, minSize: 5 },
              { id: 'artifacts', size: 50 },
            ]}
            orientation="vertical"
            className={splitter()}
          >
            <SplitterPanel id="editor">
              <Editor value={state} onChange={setState} artifacts={artifacts} />
            </SplitterPanel>

            <ArtifactsPanel panda={panda} />
          </Splitter>
        </SplitterPanel>
        <SplitterResizeTrigger id="left:preview" asChild disabled={isPreviewMode}>
          <div />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview" className={css({ zIndex: 3, pos: 'relative' })}>
          <Preview source={state.code} panda={panda} isResponsive={isResponsive} />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
