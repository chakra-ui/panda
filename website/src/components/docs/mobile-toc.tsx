'use client'

import { Toc, type TocProps } from '@/components/ui/toc'
import { drawerSlotRecipe } from '@/components/ui/drawer'
import { css, cx } from '@/styled-system/css'
import { Dialog, useDialog } from '@ark-ui/react/dialog'
import { Portal } from '@ark-ui/react/portal'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { LuListTree, LuX } from 'react-icons/lu'

const trigger = css({
  position: 'fixed',
  insetInlineEnd: '4',
  bottom: '5',
  zIndex: '15',
  display: { base: 'inline-flex', xl: 'none' },
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
 * Section navigation for long reads on mobile, where the sidebar table of
 * contents is hidden. Sits opposite the docs "Browse" pill so the two never
 * collide on a docs page.
 */
export const MobileToc = ({ data }: TocProps) => {
  const pathname = usePathname()
  const dialog = useDialog()
  const classes = drawerSlotRecipe({ size: 'xs', placement: 'end' })

  useEffect(() => {
    dialog.setOpen(false)
  }, [pathname])

  if (data.length === 0) return null

  return (
    <Dialog.RootProvider value={dialog} lazyMount>
      <Dialog.Trigger className={trigger}>
        <LuListTree size={15} aria-hidden />
        On this page
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop className={classes.backdrop} />
        <Dialog.Positioner className={classes.positioner}>
          <Dialog.Content
            className={cx(
              classes.content,
              css({ maxW: '85vw', width: '20rem' })
            )}
          >
            <div
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4',
                minH: '16',
                px: '5',
                py: '3',
                flexShrink: 0,
                borderBottomWidth: '1px',
                borderColor: 'border',
                textStyle: 'eyebrow',
                color: 'fg.subtle'
              })}
            >
              Contents
              <Dialog.CloseTrigger
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  w: '9',
                  h: '9',
                  rounded: 'full',
                  borderWidth: '1px',
                  borderColor: 'border',
                  color: 'fg',
                  cursor: 'pointer',
                  transitionProperty: 'color, background-color, border-color',
                  transitionDuration: '150ms',
                  _hover: { bg: 'bg.subtle', borderColor: 'fg.subtle' }
                })}
              >
                <LuX size={16} />
              </Dialog.CloseTrigger>
            </div>

            <div
              className={cx(classes.body, 'scroll-area', css({ pt: '5' }))}
              onClick={() => dialog.setOpen(false)}
            >
              <Toc data={data} hideTitle />
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.RootProvider>
  )
}
