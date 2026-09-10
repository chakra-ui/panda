'use client'

import { drawerSlotRecipe } from '@/components/ui/drawer'
import { useMatchMedia } from '@/lib/use-match-media'
import { css, cx } from '@/styled-system/css'
import { Center } from '@/styled-system/jsx'
import { Icon } from '@/theme/icons'
import { Dialog, useDialog } from '@ark-ui/react/dialog'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface MobileNavDrawerProps {
  trigger: React.ReactNode
  children: React.ReactNode
  /** Sits on the same row as the close button. */
  header?: React.ReactNode
}

export const MobileNavDrawer = (props: MobileNavDrawerProps) => {
  const { trigger, children, header } = props
  const dialog = useDialog()
  const classes = drawerSlotRecipe({ size: 'xs', placement: 'start' })
  const pathname = usePathname()

  const isLgUp = useMatchMedia('(min-width: 1024px)')

  useEffect(() => {
    if (isLgUp && dialog.open) {
      dialog.setOpen(false)
    }
  }, [isLgUp, dialog.open])

  useEffect(() => {
    dialog.setOpen(false)
  }, [pathname])

  return (
    <Dialog.RootProvider value={dialog} lazyMount>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Backdrop className={classes.backdrop} />
      <Dialog.Positioner className={classes.positioner}>
        <Dialog.Content className={classes.content}>
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
              borderColor: 'border'
            })}
          >
            {header ?? <span />}
            <Dialog.CloseTrigger
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                ms: 'auto',
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
              <Center width="4" height="4">
                <Icon
                  icon="Close"
                  className={css({ width: '1em', height: 'auto' })}
                />
              </Center>
            </Dialog.CloseTrigger>
          </div>
          <div className={cx(classes.body, 'scroll-area')}>{children}</div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.RootProvider>
  )
}
