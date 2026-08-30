'use client'
import { blog, docs } from '.velite'
import { Badge } from '@/components/ui/badge'
import { dialogSlotRecipe } from '@/components/ui/dialog'
import { SEARCH_HOTKEY } from '@/components/docs/search'
import { Segmented } from '@/components/ui/segmented'
import {
  convertToSearchItems,
  filterSearchItems,
  getSearchIndex,
  type SearchSection
} from '@/lib/search-index'
import { useMatchMedia } from '@/lib/use-match-media'
import { css, cx } from '@/styled-system/css'
import { createListCollection } from '@ark-ui/react/collection'
import { Combobox } from '@ark-ui/react/combobox'
import { Dialog } from '@ark-ui/react/dialog'
import { useEnvironmentContext } from '@ark-ui/react/environment'
import { createHotkeyStore } from '@zag-js/hotkeys'
import { Portal } from '@ark-ui/react/portal'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Box, Center, HStack, Stack } from 'styled-system/jsx'

const SECTIONS = ['All', 'Docs', 'Reference', 'Blog'] as const
type SectionFilter = (typeof SECTIONS)[number]

const SUGGESTIONS = ['recipes', 'tokens', 'conditions', 'staticCss']

interface Props {
  mediaQuery: string
  trigger: React.ReactNode
  limit?: number
}

export const CommandMenu = (props: Props) => {
  const { mediaQuery, trigger, limit = 8 } = props

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [section, setSection] = useState<SectionFilter>('All')
  const inputValueState = useDeferredValue(inputValue)

  const searchIndex = useMemo(() => getSearchIndex(docs, blog), [])
  const items = useMemo(() => convertToSearchItems(searchIndex), [searchIndex])

  // Filter items based on input
  const matches = useMemo(
    () => filterSearchItems(items, searchIndex, inputValueState),
    [items, searchIndex, inputValueState]
  )

  const filteredItems = useMemo(() => {
    const all = Object.values(matches).flat()
    const scoped =
      section === 'All'
        ? all
        : all.filter(item => item.section === (section as SearchSection))
    return scoped.slice(0, limit)
  }, [matches, limit, section])

  const router = useRouter()

  const collection = useMemo(
    () => createListCollection({ items: filteredItems }),
    [filteredItems]
  )

  const isMobile = useMatchMedia(mediaQuery)
  useHotkey({ enabled: !isMobile, setOpen })

  const dialogStyles = dialogSlotRecipe({
    size: 'lg',
    placement: isMobile ? 'bottom' : 'top'
  })

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      open={open}
      onOpenChange={event => setOpen(event.open)}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={dialogStyles.backdrop} />
        <Dialog.Positioner className={dialogStyles.positioner}>
          <Dialog.Content className={dialogStyles.content}>
            <Combobox.Root
              open
              disableLayer
              inputBehavior="autohighlight"
              placeholder="Search the docs"
              selectionBehavior="clear"
              loopFocus={false}
              collection={collection}
              composite={false}
              onValueChange={e => {
                router.push(e.value[0])
                requestAnimationFrame(() => {
                  setOpen(false)
                })
              }}
              onInputValueChange={({ inputValue }) => {
                setInputValue(inputValue)
              }}
            >
              <Combobox.Control
                className={css({
                  zIndex: '1',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: '1px',
                  borderColor: 'border',
                  flex: 'none',
                  alignItems: 'center',
                  padding: '0 1rem',
                  display: 'flex',
                  position: 'relative'
                })}
              >
                <Combobox.Input
                  className={css({
                    appearance: 'none',
                    height: '3.5rem',
                    background: 'transparent',
                    flex: 'auto',
                    minWidth: '0',
                    marginLeft: '.75rem',
                    marginRight: '1rem',
                    fontSize: '1rem',
                    outline: '0'
                  })}
                />
              </Combobox.Control>

              <HStack
                justify="space-between"
                gap="4"
                px="4"
                py="2.5"
                borderBottomWidth="1px"
                borderColor="border"
                flexWrap="wrap"
              >
                <Segmented
                  label="Filter results"
                  size="sm"
                  tone="pill"
                  value={section}
                  onValueChange={value => setSection(value as SectionFilter)}
                  options={SECTIONS.map(item => ({
                    value: item,
                    label: item
                  }))}
                />
                <HStack
                  gap="3"
                  textStyle="eyebrow"
                  color="fg.subtle"
                  display={{ base: 'none', md: 'flex' }}
                >
                  <span>&uarr;&darr; move</span>
                  <span>&crarr; open</span>
                  <span>esc close</span>
                </HStack>
              </HStack>

              <Combobox.Content
                className={cx(
                  'scroll-area',
                  css({
                    p: '1',
                    scrollPaddingTop: '1rem',
                    scrollPaddingBottom: '1rem',
                    overflow: 'auto',
                    maxH: '68vh',
                    overscrollBehavior: 'contain',
                    borderRadius: 'lg',
                    width: '100%',
                    maxWidth: '47.375rem',
                    minHeight: '0',
                    bg: 'bg',
                    flexDirection: 'column',
                    margin: '0 auto',
                    display: 'flex'
                  })
                )}
              >
                <Combobox.List>
                  {collection.items.length === 0 && (
                    <Center p="6" minH="32">
                      {inputValue ? (
                        <Box color="fg.muted" textStyle="sm">
                          No results for <Box as="strong">{inputValue}</Box>
                        </Box>
                      ) : (
                        <Box color="fg.muted" textStyle="sm">
                          Search the docs, reference and blog — try{' '}
                          {SUGGESTIONS.map((term, index) => (
                            <span key={term}>
                              <Box as="strong" color="fg">
                                {term}
                              </Box>
                              {index < SUGGESTIONS.length - 1 ? ', ' : '.'}
                            </span>
                          ))}
                        </Box>
                      )}
                    </Center>
                  )}
                  {collection.group().map(([group, items]) => (
                    <Combobox.ItemGroup key={group || 'results'}>
                      {group && (
                        <Combobox.ItemGroupLabel
                          className={css({
                            color: 'fg',
                            margin: '0 1rem 1rem',
                            paddingTop: '1rem',
                            fontWeight: 'medium',
                            lineHeight: '1.5rem'
                          })}
                        >
                          {group}
                        </Combobox.ItemGroupLabel>
                      )}
                      {items.map(item => (
                        <Combobox.Item
                          key={item.value}
                          item={item}
                          persistFocus
                          className={css({
                            height: 'auto',
                            px: '4',
                            py: '3',
                            rounded: 'sm',
                            _highlighted: {
                              bg: 'accent.wash'
                            }
                          })}
                        >
                          <Stack gap="1">
                            <Box fontWeight="semibold">
                              {item.label}
                              {item.type === 'heading' && (
                                <Badge>{item.category}</Badge>
                              )}
                            </Box>
                            <Box textStyle="sm" color="fg.muted" lineClamp={2}>
                              {item.description}
                            </Box>
                          </Stack>
                        </Combobox.Item>
                      ))}
                    </Combobox.ItemGroup>
                  ))}
                </Combobox.List>
              </Combobox.Content>
            </Combobox.Root>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

interface UseHotkeyProps {
  enabled: boolean
  setOpen: (open: boolean) => void
}

/**
 * `mod+k` normalises to Cmd on Apple platforms and Ctrl elsewhere, and the
 * store already ignores keystrokes typed into form fields.
 */
const useHotkey = (props: UseHotkeyProps) => {
  const { enabled, setOpen } = props
  const env = useEnvironmentContext()

  useEffect(() => {
    if (!enabled) return

    const store = createHotkeyStore({ target: env.getDocument() })
    store.register({
      id: 'open-command-menu',
      hotkey: SEARCH_HOTKEY,
      action: event => {
        event.preventDefault()
        setOpen(true)
      }
    })

    return () => store.destroy()
  }, [env, setOpen, enabled])
}
