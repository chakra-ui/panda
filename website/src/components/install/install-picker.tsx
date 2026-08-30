'use client'

import { Segmented } from '@/components/ui/segmented'
import { Clipboard } from '@ark-ui/react/clipboard'
import { css } from '@/styled-system/css'
import { Box, Stack } from '@/styled-system/jsx'
import { useState } from 'react'
import { LuCheck, LuCopy } from 'react-icons/lu'

const MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const
type Manager = (typeof MANAGERS)[number]

const SETUPS = [
  { id: 'cli', label: 'CLI', href: '/docs/compiler/cli' },
  { id: 'postcss', label: 'PostCSS', href: '/docs/compiler/postcss' },
  { id: 'vite', label: 'Vite', href: '/docs/compiler/vite' },
  { id: 'nextjs', label: 'Next.js', href: '/docs/compiler/nextjs' }
] as const
type Setup = (typeof SETUPS)[number]['id']

const ADD: Record<Manager, string> = {
  pnpm: 'pnpm add -D',
  npm: 'npm install -D',
  yarn: 'yarn add -D',
  bun: 'bun add -d'
}

const RUN: Record<Manager, string> = {
  pnpm: 'pnpm',
  npm: 'npx',
  yarn: 'yarn',
  bun: 'bunx'
}

function command(manager: Manager, setup: Setup) {
  const add = ADD[manager]
  const run = RUN[manager]
  if (setup === 'postcss') {
    return `${add} @pandacss/dev @pandacss/postcss postcss\n${run} panda init --postcss`
  }
  if (setup === 'vite' || setup === 'nextjs') {
    return `${add} @pandacss/dev @pandacss/postcss postcss\n${run} panda init --postcss`
  }
  return `${add} @pandacss/dev\n${run} panda init`
}

export function InstallPicker() {
  const [manager, setManager] = useState<Manager>('pnpm')
  const [setup, setSetup] = useState<Setup>('cli')

  const value = command(manager, setup)

  return (
    <Stack gap="8" alignItems="center">
      <Segmented
        label="Package manager"
        tone="accent"
        value={manager}
        onValueChange={value => setManager(value as Manager)}
        options={MANAGERS.map(item => ({ value: item, label: item }))}
      />

      <Segmented
        label="Setup"
        size="sm"
        value={setup}
        onValueChange={value => setSetup(value as Setup)}
        options={SETUPS.map(item => ({ value: item.id, label: item.label }))}
      />

      <Box
        w="full"
        maxW="44rem"
        borderWidth="1px"
        borderColor="border"
        rounded="md"
        bg="bg.subtle"
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gap="4"
        px="5"
        py="4"
        minH="6.5rem"
      >
        <Box
          as="pre"
          fontFamily="mono"
          textStyle="sm"
          lineHeight="1.8"
          overflowX="auto"
          className="scroll-area"
        >
          {value.split('\n').map(line => (
            <Box key={line} as="div" display="flex" gap="3">
              <Box as="span" color="accent.emphasis" userSelect="none">
                $
              </Box>
              <span>{line}</span>
            </Box>
          ))}
        </Box>
        <Clipboard.Root value={value} timeout={2000}>
          <Clipboard.Trigger
            aria-label="Copy install command"
            className={css({
              flexShrink: '0',
              p: '2',
              rounded: 'md',
              color: 'fg.subtle',
              cursor: 'pointer',
              transitionProperty: 'color, background-color',
              transitionDuration: '150ms',
              _hover: { color: 'fg', bg: 'bg.muted' }
            })}
          >
            <Clipboard.Indicator copied={<LuCheck />}>
              <LuCopy />
            </Clipboard.Indicator>
          </Clipboard.Trigger>
        </Clipboard.Root>
      </Box>

      <Box textStyle="sm" color="fg.muted">
        Full guide for{' '}
        <a
          href={SETUPS.find(s => s.id === setup)?.href}
          className={css({
            color: 'fg',
            textDecorationLine: 'underline',
            textUnderlineOffset: '3px',
            textDecorationColor: 'accent.emphasis'
          })}
        >
          {SETUPS.find(s => s.id === setup)?.label}
        </a>
      </Box>
    </Stack>
  )
}
