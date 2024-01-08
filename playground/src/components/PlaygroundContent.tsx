'use client'
import { usePanda } from '@/src/hooks/usePanda'
import { css, cx } from '@/styled-system/css'
import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { Editor } from './Editor'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { UsePlayground } from '@/src/hooks/usePlayground'
import { ColorModeSwitch } from '@/src/components/ColorModeSwitch'
import { ArtifactsPanel } from '@/src/components/ArtifactsPanel'
import { button, splitter } from '@/styled-system/recipes'
import { Examples } from '@/src/components/Examples'
import { useResponsiveView } from '@/src/hooks/useResponsiveView'
import { GitCompareArrowsIcon } from '@/src/components/icons'
import { flex } from '@/styled-system/patterns'
import { UseConfig } from '@/src/hooks/useConfig'

type PlaygroundContentProps = {
  playground: UsePlayground
  config: UseConfig
}
export const PlaygroundContent = (props: PlaygroundContentProps) => {
  const { playground, config: _config } = props

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
    onShareDiff,
    diffState,
    isSharing,
    isResponsive,
    setExample,
  } = playground

  const _state = diffState ?? state

  const { config, isLoading, error } = _config
  const panda = usePanda(_state, config)
  const responsiveView = useResponsiveView(panda.context.config.theme?.breakpoints)

  return (
    <>
      <Toolbar>
        <Examples setExample={setExample} />
        {diffState ? (
          <a
            href={`/${diffState.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cx(
              button({
                visual: 'yellow',
              }),
              css({ h: '10', p: '2', '& svg': { h: '6' } }),
            )}
            title="Open updated playground"
          >
            <GitCompareArrowsIcon />
          </a>
        ) : (
          <div className={flex({ align: 'center', h: '10', divideX: '1px', divideColor: '#282828' })}>
            <button
              data-saved={state.id ? '' : undefined}
              className={cx(
                button({
                  visual: 'yellow',
                }),
                css({ px: '4', h: 'full', '&[data-saved]': { roundedRight: '0', pr: '2' } }),
              )}
              title="Share playground"
              onClick={onShare}
              disabled={isPristine || isSharing}
            >
              {isSharing ? 'Saving...' : 'Share'}
            </button>
            <button
              hidden={!state.id}
              className={cx(
                button({
                  visual: 'yellow',
                }),
                css({ p: '0', h: 'full', roundedLeft: '0', '& svg': { h: '4' } }),
              )}
              title="Share diff playground"
              onClick={onShareDiff}
              disabled={isPristine || isSharing}
            >
              <GitCompareArrowsIcon />
            </button>
          </div>
        )}
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
              <Editor value={state} onChange={setState} panda={panda} diffState={diffState} isLoading={isLoading} />
            </SplitterPanel>

            <ArtifactsPanel panda={panda} />
          </Splitter>
        </SplitterPanel>
        <SplitterResizeTrigger id="left:preview" asChild disabled={isPreviewMode}>
          <div />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview" className={css({ zIndex: 3, pos: 'relative' })}>
          <Preview
            source={state.code}
            panda={panda}
            responsiveView={responsiveView}
            isResponsive={isResponsive}
            error={error}
          />
        </SplitterPanel>
      </Splitter>
    </>
  )
}
