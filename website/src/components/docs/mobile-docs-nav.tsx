'use client'

import { MenuIcon, XIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { Box } from '@/styled-system/jsx'
import { Portal } from '@ark-ui/react/portal'
import { useState } from 'react'
import { DocsSidebar } from './sidebar'

interface MobileDocsNavProps {
  currentSlug?: string
}

export function MobileDocsNav({ currentSlug }: MobileDocsNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className={css({
          display: { base: 'flex', lg: 'none' },
          position: 'fixed',
          bottom: 4,
          right: 4,
          alignItems: 'center',
          justifyContent: 'center',
          w: 14,
          h: 14,
          bg: 'accent.default',
          color: 'white',
          rounded: 'full',
          shadow: 'lg',
          zIndex: 40
        })}
        aria-label="Open navigation menu"
      >
        <Box as={MenuIcon} w="6" h="6" />
      </button>

      {/* Mobile sidebar */}
      {isOpen && (
        <Portal>
          <div
            className={css({
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: { lg: 'none' }
            })}
          >
            {/* Backdrop */}
            <button
              onClick={() => setIsOpen(false)}
              className={css({
                position: 'absolute',
                inset: 0,
                bg: 'black',
                opacity: 0.5,
                cursor: 'default'
              })}
              aria-label="Close navigation menu"
            />

            {/* Sidebar */}
            <div
              className={css({
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                w: 80,
                maxW: 'full',
                bg: 'bg.default',
                shadow: 'xl',
                overflowY: 'auto'
              })}
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className={css({
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  p: 2,
                  rounded: 'md',
                  _hover: { bg: 'bg.subtle' }
                })}
                aria-label="Close navigation menu"
              >
                <Box as={XIcon} w="5" h="5" />
              </button>

              {/* Sidebar content */}
              <Box pt="16" pb="8">
                <DocsSidebar currentSlug={currentSlug} />
              </Box>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
