'use client'
import { usePanda } from '@/src/hooks/usePanda'
import { css } from '@/styled-system/css'
import {
  Splitter,
  SplitterPanel,
  SplitterResizeTrigger,
  TabContent,
  TabIndicator,
  TabList,
  TabTrigger,
  Tabs,
} from '@ark-ui/react'
import { ASTViewer } from './ASTViewer'
import { Editor } from './Editor'
import { GeneratedCss } from './GeneratedCss'
import { LayoutControl } from './LayoutControl'
import { Preview } from './Preview'
import { Toolbar } from './Toolbar'
import { UsePlayGroundProps, usePlayground } from '@/src/hooks/usePlayground'
import { ColorModeSwitch } from '@/src/components/ColorModeSwitch'

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
          { id: 'editor', size: 50 },
          { id: 'preview', size: 50 },
        ]}
        orientation={layout}
        className={css({ flex: '1' })}
      >
        <SplitterPanel id="editor" className={css({ display: 'flex', alignItems: 'stretch' })}>
          <Editor value={state} onChange={setState} artifacts={artifacts} />
        </SplitterPanel>
        <SplitterResizeTrigger id="editor:preview" asChild>
          <div className={css({ background: 'border.default', minWidth: '1px', minHeight: '1px' })} />
        </SplitterResizeTrigger>
        <SplitterPanel id="preview" className={css({ display: 'flex', alignItems: 'stretch' })}>
          <Tabs
            defaultValue="preview"
            className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}
          >
            <TabList
              className={css({
                px: '6',
                borderBottomWidth: '1px',
                borderColor: 'border.default',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '3',
                '& button': {
                  py: '3',
                  bg: 'transparent',
                  fontWeight: 'medium',
                  color: { base: 'gray.500', _dark: 'gray.400' },
                  _selected: {
                    color: { base: 'gray.900', _dark: 'white' },
                  },
                },
              })}
            >
              <TabTrigger value="preview">Preview</TabTrigger>
              <TabTrigger value="ast">AST</TabTrigger>
              <TabTrigger value="generated">Generated</TabTrigger>
              <TabIndicator className={css({ background: 'yellow.400', height: '2px', mb: '-1px' })} />
            </TabList>
            <TabContent value="preview" className={css({ flex: '1' })}>
              <Preview source={state.code} previewCss={previewCss} previewJs={previewJs} patternNames={patternNames} />
            </TabContent>
            <TabContent value="ast" className={css({ flex: '1', minHeight: 0 })}>
              <ASTViewer parserResult={panda.parserResult} />
            </TabContent>
            <TabContent value="generated" className={css({ flex: '1', minHeight: 0 })}>
              <GeneratedCss cssArtifacts={panda.cssArtifacts} />
            </TabContent>
          </Tabs>
        </SplitterPanel>
      </Splitter>
    </>
  )
}
