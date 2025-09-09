'use client'
import { docs } from '.velite'
import {
  convertToSearchItems,
  filterSearchItems,
  getSearchIndex
} from '@/lib/search-index'
import { useMediaQuery } from '@/lib/use-media-query'
import { css, cx } from '@/styled-system/css'
import { createListCollection } from '@ark-ui/react/collection'
import { Combobox } from '@ark-ui/react/combobox'
import { Dialog } from '@ark-ui/react/dialog'
import { useEnvironmentContext } from '@ark-ui/react/environment'
import { Portal } from '@ark-ui/react/portal'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Box, Center, Stack } from 'styled-system/jsx'
import { dialogSlotRecipe } from '../ui/dialog'

interface Props {
  mediaQuery: string
  trigger: React.ReactNode
}

export const CommandMenu = (props: Props) => {
  const { mediaQuery, trigger } = props

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const searchIndex = useMemo(() => getSearchIndex(docs), [])
  const items = useMemo(() => convertToSearchItems(searchIndex), [searchIndex])

  // Filter items based on input
  const matches = useMemo(
    () => filterSearchItems(items, searchIndex, inputValue),
    [items, searchIndex, inputValue]
  )

  const filteredItems = useMemo(
    () => Object.values(matches).flat().slice(0, 10),
    [matches]
  )

  const router = useRouter()

  const collection = useMemo(
    () => createListCollection({ items: filteredItems }),
    [filteredItems]
  )

  const isMobile = useMediaQuery(mediaQuery)
  useHotkey({ enabled: !isMobile, setOpen })

  const dialogStyles = dialogSlotRecipe({ size: 'lg' })

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
              onValueChange={e => {
                router.push(e.value[0])
                requestAnimationFrame(() => {
                  setOpen(false)
                })
              }}
              onInputValueChange={({ inputValue }) => setInputValue(inputValue)}
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
                    <Center p="3" minH="40">
                      <Box color="fg.muted" textStyle="sm">
                        No results found for <Box as="strong">{inputValue}</Box>
                      </Box>
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
                              bg: 'bg.main'
                            }
                          })}
                        >
                          <Stack gap="1">
                            <Box fontWeight="semibold">
                              {item.label}
                              {item.type === 'heading' && (
                                <Box
                                  as="span"
                                  opacity="0.8"
                                  borderWidth="1px"
                                  fontWeight="medium"
                                  px="2"
                                  ms="2"
                                  rounded="sm"
                                  bg="bg"
                                >
                                  {item.category}
                                </Box>
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

const useHotkey = (props: UseHotkeyProps) => {
  const { enabled, setOpen } = props

  const env = useEnvironmentContext()

  useEffect(() => {
    const document = env.getDocument()
    const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator?.platform)
    const hotkey = isMac ? 'metaKey' : 'ctrlKey'

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() === 'k' && event[hotkey] && enabled) {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeydown, true)
    return () => {
      document.removeEventListener('keydown', handleKeydown, true)
    }
  }, [env, setOpen, enabled])
}
