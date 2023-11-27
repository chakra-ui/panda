'use client'
import { usePanda } from '@/src/hooks/usePanda'
import { css, cx } from '@/styled-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { Editor } from './Editor'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { UsePlayGroundProps, usePlayground } from '@/src/hooks/usePlayground'
import { ColorModeSwitch } from '@/src/components/ColorModeSwitch'
import { ArtifactsPanel } from '@/src/components/ArtifactsPanel'
import { button, splitter } from '@/styled-system/recipes'
import { Examples } from '@/src/components/Examples'
import { useResponsiveView } from '@/src/hooks/useResponsiveView'

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
    setExample,
  } = usePlayground(props)
  const panda = usePanda(state.code, state.css, state.config)
  const responsiveView = useResponsiveView(panda)

  const { artifacts } = panda

  return (
    <>
      <Toolbar>
        <Examples setExample={setExample} />
        <button
          className={cx(
            button({
              visual: 'yellow',
            }),
            css({ px: '4' }),
          )}
          onClick={onShare}
          disabled={isPristine || isSharing}
        >
          {isSharing ? 'Saving...' : 'Share'}
        </button>
        <LayoutControl
          value={layoutValue}
          onChange={switchLayout}
          setResponsiveSize={responsiveView.setResponsiveSize}
          breakpoints={responsiveView.breakpoints}
          isResponsive={isResponsive}
        />
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
          <Preview source={state.code} panda={panda} responsiveView={responsiveView} isResponsive={isResponsive} />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
