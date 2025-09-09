'use client'
import { useMediaQuery } from '@/lib/use-media-query'
import { css } from '@/styled-system/css'
import { createListCollection } from '@ark-ui/react/collection'
import { Combobox } from '@ark-ui/react/combobox'
import { Dialog } from '@ark-ui/react/dialog'
import { useEnvironmentContext } from '@ark-ui/react/environment'
import { Portal } from '@ark-ui/react/portal'
import { matchSorter } from 'match-sorter'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const { matchEntries, filteredItems } = useFilteredItems({}, inputValue)
  const router = useRouter()
  const collection = createListCollection({ items: filteredItems })

  const isMobile = useMediaQuery(mediaQuery)
  useHotkey({ enabled: !isMobile, setOpen })

  const dialogStyles = dialogSlotRecipe()

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
                className={css({
                  px: '0',
                  py: '0',
                  overflow: 'auto',
                  maxH: '68vh',
                  overscrollBehavior: 'contain',
                  borderRadius: 'lg',
                  width: '100%',
                  maxWidth: '47.375rem',
                  minHeight: '0',
                  background: 'bg',
                  flexDirection: 'column',
                  margin: '0 auto',
                  display: 'flex'
                })}
              >
                <Combobox.List>
                  {matchEntries.length === 0 && (
                    <Center p="3" minH="40">
                      <Box color="fg.muted" textStyle="sm">
                        No results found for <Box as="strong">{inputValue}</Box>
                      </Box>
                    </Center>
                  )}
                  {matchEntries.map(([key, items]) => (
                    <Combobox.ItemGroup key={key}>
                      <Combobox.ItemGroupLabel
                        className={css({
                          color: 'fg',
                          margin: '0 1.5rem 1rem',
                          paddingTop: '2.5rem',
                          fontWeight: 'medium',
                          lineHeight: '1.5rem'
                        })}
                      >
                        {key}
                      </Combobox.ItemGroupLabel>
                      {items.map(item => (
                        <Combobox.Item
                          key={item.value}
                          item={item}
                          persistFocus
                          className={css({
                            height: 'auto',
                            px: '4',
                            py: '3'
                          })}
                        >
                          <Stack gap="0">
                            <Box fontWeight="medium">{item.label}</Box>
                            <Box
                              textStyle="sm"
                              fontWeight="medium"
                              color="colorPalette.default"
                            >
                              {item.category}
                            </Box>
                            <Box
                              textStyle="sm"
                              color="fg.muted"
                              mt="0.5"
                              lineClamp={2}
                            >
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

const useFilteredItems = (data: Record<string, any[]>, inputValue: string) => {
  const items = useMemo(() => Object.values(data).flat(), [data])

  const filter = useCallback(
    (value: string): Record<string, any[]> => {
      if (!value) return data

      const results = matchSorter(items, value, {
        keys: ['label', 'description']
      })
      return results.length ? { 'Search Results:': results } : {}
    },
    [items, data]
  )
  const matches = useMemo(() => filter(inputValue), [inputValue, filter])
  const matchEntries = useMemo(() => Object.entries(matches), [matches])
  const filteredItems = useMemo(() => Object.values(matches).flat(), [matches])

  return { matchEntries, filteredItems }
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
