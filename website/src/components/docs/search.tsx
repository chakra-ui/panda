'use client'

import { SearchIcon } from '@/icons/search'
import { css } from '@/styled-system/css'
import { Box, Flex } from '@/styled-system/jsx'
import { useState } from 'react'

export const SearchInput = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 1.5,
          w: { base: 'auto', sm: '64' },
          bg: 'bg.subtle',
          rounded: 'md',
          fontSize: 'sm',
          color: 'fg.muted',
          transition: 'colors',
          _hover: {
            bg: 'bg.muted',
            color: 'fg'
          }
        })}
      >
        <Box as={SearchIcon} w="4" h="4" />
        <span className={css({ display: { base: 'none', sm: 'block' } })}>
          Search documentation...
        </span>
        <span
          className={css({
            display: { base: 'none', md: 'block' },
            ml: 'auto'
          })}
        >
          <kbd
            className={css({
              px: 1.5,
              py: 0.5,
              bg: 'bg.default',
              rounded: 'sm',
              fontSize: 'xs',
              fontFamily: 'mono'
            })}
          >
            ⌘K
          </kbd>
        </span>
      </button>

      {/* Search Modal - To be implemented */}
      {isOpen && (
        <div
          className={css({
            position: 'fixed',
            inset: 0,
            bg: 'black',
            opacity: 0.5,
            zIndex: 50
          })}
          onClick={() => setIsOpen(false)}
        >
          <Flex
            align="center"
            justify="center"
            minH="screen"
            p="4"
            onClick={e => e.stopPropagation()}
          >
            <Box
              bg="bg.default"
              rounded="lg"
              shadow="xl"
              maxW="2xl"
              w="full"
              p="6"
            >
              <p className={css({ textAlign: 'center', color: 'fg.muted' })}>
                Search functionality will be implemented here.
                <br />
                You can integrate with Algolia, FlexSearch, or other search
                providers.
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className={css({
                  mt: 4,
                  px: 4,
                  py: 2,
                  bg: 'accent',
                  color: 'white',
                  rounded: 'md',
                  fontSize: 'sm',
                  fontWeight: 'medium',
                  mx: 'auto',
                  display: 'block',
                  _hover: {
                    bg: 'accent.emphasized'
                  }
                })}
              >
                Close
              </button>
            </Box>
          </Flex>
        </div>
      )}
    </>
  )
}
