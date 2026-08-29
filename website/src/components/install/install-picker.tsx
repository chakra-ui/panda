'use client'

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

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  minH: '11',
  px: '5',
  textStyle: 'sm',
  fontWeight: 'medium',
  cursor: 'pointer',
  borderWidth: '1px',
  borderColor: 'border',
  rounded: 'md',
  color: 'fg.muted',
  bg: 'transparent',
  transitionProperty: 'color, background-color, border-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg', borderColor: 'fg.subtle' },
  '&[aria-checked=true]': {
    color: 'fg',
    bg: 'accent.wash',
    borderColor: 'accent.emphasis'
  }
})

const tabStyles = css({
  textStyle: 'sm',
  fontWeight: 'medium',
  px: '4',
  py: '2',
  cursor: 'pointer',
  color: 'fg.muted',
  bg: 'transparent',
  transitionProperty: 'color, background-color',
  transitionDuration: '150ms',
  _hover: { color: 'fg' },
  '&[aria-selected=true]': { color: 'fg', bg: 'bg.muted' }
})

export function InstallPicker() {
  const [manager, setManager] = useState<Manager>('pnpm')
  const [setup, setSetup] = useState<Setup>('cli')
  const [copied, setCopied] = useState(false)

  const value = command(manager, setup)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Stack gap="8" alignItems="center">
      <Box
        role="radiogroup"
        aria-label="Package manager"
        display="grid"
        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
        gap="3"
        w="full"
        maxW="34rem"
      >
        {MANAGERS.map(item => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={manager === item}
            onClick={() => setManager(item)}
            className={optionStyles}
          >
            {manager === item && <LuCheck aria-hidden />}
            {item}
          </button>
        ))}
      </Box>

      <Box
        role="tablist"
        aria-label="Setup"
        display="inline-flex"
        borderWidth="1px"
        borderColor="border"
        rounded="md"
        overflow="hidden"
      >
        {SETUPS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={setup === item.id}
            onClick={() => setSetup(item.id)}
            className={tabStyles}
          >
            {item.label}
          </button>
        ))}
      </Box>

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
        <button
          type="button"
          onClick={copy}
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
          {copied ? <LuCheck /> : <LuCopy />}
        </button>
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
