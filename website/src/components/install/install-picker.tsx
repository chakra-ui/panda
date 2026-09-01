'use client'

import { Segmented } from '@/components/ui/segmented'
import { Clipboard } from '@ark-ui/react/clipboard'
import { css } from '@/styled-system/css'
import { textLink } from '@/styled-system/recipes'
import { Box, Stack } from '@/styled-system/jsx'
import { useState } from 'react'
import { LuCheck, LuCopy } from 'react-icons/lu'
import { SiBun, SiNpm, SiPnpm, SiYarn } from 'react-icons/si'

const MANAGERS = [
  { id: 'pnpm', label: 'pnpm', icon: <SiPnpm /> },
  { id: 'npm', label: 'npm', icon: <SiNpm /> },
  { id: 'yarn', label: 'yarn', icon: <SiYarn /> },
  { id: 'bun', label: 'bun', icon: <SiBun /> }
] as const
type Manager = (typeof MANAGERS)[number]['id']

const SETUPS = [
  { id: 'cli', label: 'CLI', href: '/docs/get-started/cli' },
  { id: 'postcss', label: 'PostCSS', href: '/docs/get-started/postcss' },
  { id: 'vite', label: 'Vite', href: '/docs/get-started/vite' },
  { id: 'nextjs', label: 'Next.js', href: '/docs/get-started/nextjs' }
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
      <Box w="full" maxW="40rem">
        <Segmented
          label="Package manager"
          tone="card"
          value={manager}
          onValueChange={value => setManager(value as Manager)}
          options={MANAGERS.map(item => ({
            value: item.id,
            label: item.label,
            icon: item.icon
          }))}
        />
      </Box>

      <Segmented
        label="Setup"
        tone="pill"
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
          className={textLink()}
        >
          {SETUPS.find(s => s.id === setup)?.label}
        </a>
      </Box>
    </Stack>
  )
}
