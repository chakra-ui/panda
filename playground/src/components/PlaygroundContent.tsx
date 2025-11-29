'use client'
import { UseConfig } from '@/src/hooks/useConfig'
import { usePanda } from '@/src/hooks/usePanda'
import { UsePlayground } from '@/src/hooks/usePlayground'
import { useResponsiveView } from '@/src/hooks/useResponsiveView'
import { css, cx } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { button, splitter } from '@/styled-system/recipes'
import { Splitter } from '@ark-ui/react/splitter'
import { ArtifactsPanel } from './ArtifactsPanel'
import { Editor } from './Editor'
import { Examples } from './Examples'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { GitCompareArrowsIcon } from './icons'

interface Props {
  playground: UsePlayground
  config: UseConfig
}
export const PlaygroundContent = (props: Props) => {
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
    deferredState,
    setState,
    onShare,
    onShareDiff,
    diffState,
    isSharing,
    isResponsive,
    setExample,
  } = playground

  // Use deferred state for expensive panda processing
  const _state = diffState ?? deferredState

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
          <div
            className={flex({
              align: 'center',
              h: '10',
              divideX: '1px',
              divideColor: { base: 'white', _dark: '#282828' },
            })}
          >
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
      </Toolbar>
      <Splitter.Root panels={panels} onResize={onResizePanels} orientation={layout} className={splitter()}>
        <Splitter.Panel id="left">
          <Splitter.Root
            panels={[{ id: 'editor', minSize: 5 }, { id: 'artifacts' }]}
            defaultSize={[50, 50]}
            orientation="vertical"
            className={splitter()}
          >
            <Splitter.Panel id="editor">
              <Editor value={state} onChange={setState} panda={panda} diffState={diffState} isLoading={isLoading} />
            </Splitter.Panel>

            <ArtifactsPanel panda={panda} />
          </Splitter.Root>
        </Splitter.Panel>
        <Splitter.ResizeTrigger id="left:preview" asChild disabled={isPreviewMode}>
          <div />
        </Splitter.ResizeTrigger>
        <Splitter.Panel id="preview" className={css({ zIndex: 3, pos: 'relative' })}>
          <Preview
            source={_state.code}
            panda={panda}
            responsiveView={responsiveView}
            isResponsive={isResponsive}
            error={error ?? (panda.context.error as Error)}
          />
        </Splitter.Panel>
      </Splitter.Root>
    </>
  )
}
