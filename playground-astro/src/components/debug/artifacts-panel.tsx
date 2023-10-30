import React from 'react'
import {
  Segment,
  SegmentControl,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentLabel,
  SplitterResizeTrigger,
  SplitterPanel,
} from '@ark-ui/react'

import { ChevronUpIcon } from '@/components/ui/icons'
import { ASTViewer } from '@/components/debug/ast-viewer'
import { usePanda } from '@/hooks/use-panda'
import { GeneratedCss } from '@/components/debug/generated-css'
import { cx, cva, css } from 'styled-system/css'
import { Flex, styled } from 'styled-system/jsx'
import { segmentGroup } from 'styled-system/recipes'

type ArtifactsPanelType = {
  panda: ReturnType<typeof usePanda>
}

const tabs = [
  {
    id: 'ast',
    label: 'AST',
  },
  {
    id: 'generated',
    label: 'CSS',
  },
]

export function ArtifactsPanel(props: ArtifactsPanelType) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'ast' | 'generated'>('ast')

  function handleClick() {
    setOpen((s) => !s)
  }

  return (
    <>
      <SplitterResizeTrigger id='editor:artifacts' asChild hidden={!open}>
        <div />
      </SplitterResizeTrigger>
      <SplitterPanel id='artifacts' className={artifactsPanel({ open })}>
        <Flex
          w='full'
          h='12'
          cursor='pointer'
          px='6'
          py='2'
          align='center'
          justify='space-between'
          borderBottomWidth='1px'
          onClick={handleClick}
          zIndex={2}
        >
          <SegmentGroup
            data-expanded={open ? '' : undefined}
            className={cx(segmentGroup(), 'group')}
            value={activeTab}
            onClick={(e) => {
              if (open) e.stopPropagation()
            }}
            onChange={(e) => setActiveTab(e.value as any)}
          >
            <SegmentGroupIndicator
              className={css({
                background: { base: 'transparent', _groupExpanded: 'primary' },
              })}
            />
            {tabs.map((option, id) => (
              <Segment
                key={id}
                value={option.id}
                data-expanded={open ? '' : undefined}
                className={css({
                  '&:not([data-expanded])': {
                    bg: { base: 'gray.100', _dark: '#1d1e1fc4' },
                    shadow: 'sm',
                    rounded: 'md',
                  },
                })}
              >
                <SegmentLabel
                  className={css({
                    px: '2',
                    _checked: {
                      color: {
                        base: { base: 'inherit', _hover: 'text.default' },
                        _groupExpanded: 'black',
                      },
                    },
                  })}
                >
                  {option.label}
                </SegmentLabel>
                <SegmentControl />
              </Segment>
            ))}
          </SegmentGroup>
          <styled.span
            data-expanded={open ? '' : undefined}
            transform={{ _expanded: 'rotate(180deg)' }}
            transition='all .2s ease'
            color={{ _expanded: { _dark: 'primary' } }}
          >
            <ChevronUpIcon />
          </styled.span>
        </Flex>
        {activeTab === 'ast' && (
          <ASTViewer parserResult={props.panda.parserResult} />
        )}
        {/* Using visible cause it's better to let the monaco editor be loader with the others */}
        <GeneratedCss
          cssArtifacts={props.panda.cssArtifacts}
          visible={activeTab === 'generated' && open}
        />
      </SplitterPanel>
    </>
  )
}

const artifactsPanel = cva({
  base: {
    flexDir: 'column',
    minH: '12',
    background: { _dark: '#262626' },
    zIndex: '3',
  },
  variants: {
    open: {
      false: {
        maxH: '12',
        borderTopWidth: '1px',
      },
    },
  },
})