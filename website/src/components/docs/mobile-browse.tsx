'use client'

import { Sidebar } from '@/components/docs/sidebar'
import { drawerSlotRecipe } from '@/components/ui/drawer'
import { getTab } from '@/docs.config'
import { css, cx } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { Dialog, useDialog } from '@ark-ui/react/dialog'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { LuList, LuX } from 'react-icons/lu'

const trigger = css({
  position: 'fixed',
  insetInlineStart: '4',
  bottom: '5',
  zIndex: '15',
  display: { base: 'inline-flex', lg: 'none' },
  alignItems: 'center',
  gap: '2',
  minH: '11',
  px: '4',
  rounded: 'full',
  bg: 'bg',
  borderWidth: '1px',
  borderColor: 'border',
  shadow: 'lg',
  textStyle: 'eyebrow',
  color: 'fg',
  cursor: 'pointer'
})

/**
 * Section navigation on mobile. The hamburger answers "where in the site am I";
 * this answers "where in this section am I", the same split bun uses.
 */
export const MobileBrowse = () => {
  const pathname = usePathname()
  const dialog = useDialog()

  const tabKey = pathname?.split('/')[2]
  const tab = tabKey ? getTab(tabKey) : undefined
  const classes = drawerSlotRecipe({ size: 'xs', placement: 'start' })

  useEffect(() => {
    dialog.setOpen(false)
  }, [pathname])

  if (!tab) return null

  return (
    <Dialog.RootProvider value={dialog} lazyMount>
      <Dialog.Trigger className={trigger}>
        <LuList size={15} aria-hidden />
        Browse {tab.title}
      </Dialog.Trigger>

      <Dialog.Backdrop className={classes.backdrop} />
      <Dialog.Positioner className={classes.positioner}>
        <Dialog.Content
          className={cx(classes.content, css({ maxW: '85vw', width: '20rem' }))}
        >
          <div className={cx(classes.body, 'scroll-area')}>
            <Box
              display="flex"
              alignItems="center"
              minH="12"
              pe="12"
              mb="2"
              textStyle="eyebrow"
              color="fg.subtle"
            >
              {tab.title}
            </Box>

            <Box borderTopWidth="1px" borderColor="border" pt="6">
              <Sidebar tabKey={tabKey} />
            </Box>
          </div>

          <Dialog.CloseTrigger
            className={cx(
              classes.closeTrigger,
              css({ color: 'fg', display: 'flex' })
            )}
          >
            <LuX size={18} />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.RootProvider>
  )
}
