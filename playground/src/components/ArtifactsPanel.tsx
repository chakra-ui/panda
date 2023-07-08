import React from 'react'
import { css, cva } from '@/styled-system/css'
import { panda, Flex, Stack } from '@/styled-system/jsx'
import {
  Segment,
  SegmentControl,
  SegmentGroup,
  SegmentIndicator,
  SegmentInput,
  SegmentLabel,
  SplitterResizeTrigger,
  SplitterPanel,
} from '@ark-ui/react'

import { AccountTree, ChevronUpIcon, Computer } from './icons'
import { ASTViewer } from '@/src/components/ASTViewer'
import { usePanda } from '@/src/hooks/usePanda'
import { GeneratedCss } from '@/src/components/GeneratedCss'
import { flex } from '@/styled-system/patterns'

type ArtifactsPanelType = {
  panda: ReturnType<typeof usePanda>
}

const tabs = [
  {
    id: 'ast',
    label: 'AST',
    icon: <AccountTree />,
  },
  {
    id: 'generated',
    label: 'CSS',
    icon: <Computer />,
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
      <SplitterResizeTrigger id="editor:artifacts" asChild hidden={!open}>
        <div />
      </SplitterResizeTrigger>
      <SplitterPanel id="artifacts" className={artifactsPanel({ open })}>
        <Flex
          w="full"
          h="12"
          cursor="pointer"
          px="6"
          py="2"
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderBottomColor="border.default"
          onClick={handleClick}
          zIndex={2}
        >
          <SegmentGroup
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '4',
              px: '1',
              py: '2',
              borderBottomWidth: '1px',
              borderBottomColor: 'border.default',
            })}
            value={activeTab}
            onClick={(e) => {
              if (open) e.stopPropagation()
            }}
            onChange={(e) => setActiveTab(e.value as any)}
          >
            <SegmentIndicator
              data-expanded={open ? '' : undefined}
              className={css({
                background: { base: 'transparent', _expanded: 'primary' },
                zIndex: '0',
                boxShadow: 'xs',
                borderRadius: 'md',
              })}
            />
            {tabs.map((option, id) => (
              <Segment
                className={css({
                  zIndex: '1',
                  position: 'relative',
                  fontWeight: 'semibold',
                  color: '#FFFFFF4D',
                  p: '1',
                  cursor: 'pointer',
                  display: 'flex',
                })}
                key={id}
                value={option.id}
              >
                <SegmentLabel
                  data-expanded={open ? '' : undefined}
                  className={flex({
                    gap: '2',
                    px: '2',
                    align: 'center',
                    alignSelf: 'center',
                    color: { base: 'text.default', _checked: { _expanded: 'black' } },
                    transition: 'color 170ms ease-in-out',
                  })}
                >
                  {option.icon} {option.label}
                </SegmentLabel>
                <SegmentInput />
                <SegmentControl />
              </Segment>
            ))}
          </SegmentGroup>
          <panda.span
            data-expanded={open ? '' : undefined}
            transform={{ _expanded: 'rotate(180deg)' }}
            transition="all .2s ease"
            color={{ _expanded: { _dark: 'primary' } }}
          >
            <ChevronUpIcon />
          </panda.span>
        </Flex>
        <Stack flex="auto">
          {activeTab === 'ast' && <ASTViewer parserResult={props.panda.parserResult} />}
          {/* Using visible cause it's better to let the monaco editor be loader with the others */}
          <GeneratedCss cssArtifacts={props.panda.cssArtifacts} visible={activeTab === 'generated' && open} />
        </Stack>
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
    transition: 'flex-grow .2s ease-out',
  },
  variants: {
    open: {
      false: {
        maxH: '12',
        borderTopWidth: '1px',
        borderTopColor: 'border.default',
      },
    },
  },
})
