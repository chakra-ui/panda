import { Splitter, SplitterPanel, SplitterResizeTrigger } from '@ark-ui/react'
import { flex, hstack } from 'styled-system/patterns'
import { css, cx } from 'styled-system/css'
import { button, splitter } from 'styled-system/recipes'
import { usePanda } from '../hooks/use-panda'
import { type UsePlayGroundProps, usePlayground } from '../hooks/use-playground'
import { ArtifactsPanel } from './debug/artifacts-panel'
import { ColorModeSwitch } from './toolbar/color-mode-switch'
import { Editor } from './editor/editor'
import { Examples } from './examples/examples-select'
import { LayoutControl } from './toolbar/layout-control'
import { Toolbar } from './toolbar/toolbar'

import { UnstyledOpenInCodeSandboxButton } from '@codesandbox/sandpack-react'
import { SiCodesandbox } from 'react-icons/si'

import { PreviewWindow } from './preview/preview-window'
import { WithSandpackProvider } from './with-sandpack-provider'

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
    <WithSandpackProvider code={state.code} config={state.config} panda={panda}>
      <div
        className={flex({
          direction: 'column',
          height: '100dvh',
          overflow: 'hidden',
        })}
      >
        <Toolbar>
          <UnstyledOpenInCodeSandboxButton
            className={cx(button(), hstack({ gap: 1 }))}
          >
            <SiCodesandbox />
            Open in CodeSandbox
          </UnstyledOpenInCodeSandboxButton>
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
                <Editor
                  value={state}
                  onChange={setState}
                  artifacts={artifacts}
                />
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
            <PreviewWindow
              source={state.code}
              panda={panda}
              isResponsive={isResponsive}
            />
          </SplitterPanel>
        </Splitter>
      </div>
    </WithSandpackProvider>
  )
}
