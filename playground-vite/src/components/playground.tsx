import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { cx, css } from '../../styled-system/css'
import { button, splitter } from '../../styled-system/recipes'
import { usePanda } from '../hooks/use-panda'
import { UsePlayGroundProps, usePlayground } from '../hooks/use-playground'
import { ColorModeSwitch } from './color-mode-switch'
import { Editor } from './editor'
import { LayoutControl } from './layout-control'
import { Toolbar } from './toolbar'
import { Examples } from './examples'
import { ArtifactsPanel } from './artifacts-panel'
import { Preview } from './preview'
import { flex } from 'styled-system/patterns'

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
  const panda = usePanda(state.code, state.config)
  const { artifacts } = panda

  return (
    <div
      className={flex({
        direction: 'column',
        height: '100dvh',
        overflow: 'hidden',
      })}
    >
      <Toolbar>
        <Examples setExample={setExample} />
        <button
          className={cx(
            button({
              visual: 'yellow',
            }),
            css({ px: '4' })
          )}
          onClick={onShare}
          disabled={isPristine || isSharing}
        >
          {isSharing ? 'Saving...' : 'Share'}
        </button>
        <LayoutControl
          value={layoutValue}
          onChange={switchLayout}
          isResponsive={isResponsive}
        />
        <ColorModeSwitch />
      </Toolbar>
      <Splitter
        size={panels}
        onResize={onResizePanels}
        orientation={layout}
        className={splitter()}
      >
        <SplitterPanel id='left'>
          <Splitter
            size={[
              { id: 'editor', size: 50, minSize: 5 },
              { id: 'artifacts', size: 50 },
            ]}
            orientation='vertical'
            className={splitter()}
          >
            <SplitterPanel id='editor'>
              <Editor value={state} onChange={setState} artifacts={artifacts} />
            </SplitterPanel>

            <ArtifactsPanel panda={panda} />
          </Splitter>
        </SplitterPanel>
        <SplitterResizeTrigger
          id='left:preview'
          asChild
          disabled={isPreviewMode}
        >
          <div />
        </SplitterResizeTrigger>
        <SplitterPanel
          id='preview'
          className={css({ zIndex: 3, pos: 'relative' })}
        >
          <Preview
            source={state.code}
            panda={panda}
            isResponsive={isResponsive}
          />
        </SplitterPanel>
      </Splitter>
    </div>
  )
}
