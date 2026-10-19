import { ASTViewer } from '@/src/components/ASTViewer'
import { GeneratedCss } from '@/src/components/GeneratedCss'
import { usePanda } from '@/src/hooks/usePanda'
import { css, cva, cx } from '@/styled-system/css'
import { Flex, panda } from '@/styled-system/jsx'
import { segmentGroup, splitter } from '@/styled-system/recipes'
import { SegmentGroup } from '@ark-ui/react/segment-group'
import { Splitter } from '@ark-ui/react/splitter'
import * as React from 'react'
import { ChevronUpIcon } from './icons'

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

export const ArtifactsPanel = React.memo(function ArtifactsPanel(props: ArtifactsPanelType) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'ast' | 'generated'>('ast')

  function handleClick() {
    setOpen((s) => !s)
  }

  const splitterClasses = splitter()
  const classes = segmentGroup()

  return (
    <>
      <Splitter.ResizeTrigger id="editor:artifacts" asChild hidden={!open} className={splitterClasses.resizeTrigger}>
        <div />
      </Splitter.ResizeTrigger>
      <Splitter.Panel id="artifacts" className={cx(splitterClasses.panel, artifactsPanel({ open }))}>
        <Flex
          w="full"
          h="12"
          cursor="pointer"
          px="6"
          py="2"
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          onClick={handleClick}
          zIndex={2}
        >
          <SegmentGroup.Root
            data-expanded={open ? '' : undefined}
            className={cx(classes.root, 'group')}
            value={activeTab}
            onClick={(e) => {
              if (open) e.stopPropagation()
            }}
            onValueChange={(e) => setActiveTab(e.value as any)}
          >
            <SegmentGroup.Indicator
              className={cx(
                classes.indicator,
                css({
                  background: { base: 'transparent', _groupExpanded: 'primary' },
                  width: 'var(--width)',
                  height: 'var(--height)',
                  top: 'var(--top)',
                  left: 'var(--left)',
                }),
              )}
            />
            {tabs.map((option, id) => (
              <SegmentGroup.Item
                key={id}
                value={option.id}
                data-expanded={open ? '' : undefined}
                className={cx(
                  classes.item,
                  css({
                    '&:not([data-expanded])': {
                      bg: { base: 'gray.100', _dark: '#1d1e1fc4' },
                      shadow: 'sm',
                      rounded: 'md',
                    },
                  }),
                )}
              >
                <SegmentGroup.ItemText
                  className={cx(
                    classes.itemText,
                    css({
                      px: '2',
                      _checked: {
                        color: {
                          base: { base: 'inherit', _hover: 'text.default' },
                          _groupExpanded: 'black',
                        },
                      },
                    }),
                  )}
                >
                  {option.label}
                </SegmentGroup.ItemText>
                <SegmentGroup.ItemControl />
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            ))}
          </SegmentGroup.Root>
          <panda.span
            data-expanded={open ? '' : undefined}
            transform={{ _expanded: 'rotate(180deg)' }}
            transition="all .2s ease"
            color={{ _expanded: { _dark: 'primary' } }}
          >
            <ChevronUpIcon />
          </panda.span>
        </Flex>
        {activeTab === 'ast' && <ASTViewer parserResult={props.panda.parserResult} />}
        {/* Using visible cause it's better to let the monaco editor be loaded with the others */}
        <GeneratedCss cssArtifacts={props.panda.cssArtifacts} visible={activeTab === 'generated' && open} />
      </Splitter.Panel>
    </>
  )
})

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
