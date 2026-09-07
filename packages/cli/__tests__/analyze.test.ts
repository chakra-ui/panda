import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runAnalyze } from '../src'
import { createFixture, cleanupFixture } from './helpers'

describe('cli analyze', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('analyzes token and keyframe usage across sources', async () => {
    dir = createFixture()
    writeFileSync(
      join(dir, 'App.tsx'),
      "import { css } from '@panda/css';\nimport { token } from '@panda/tokens';\ncss({ color: token('colors.red.500'), animationName: 'spin' })",
    )

    const result = await runAnalyze({ cwd: dir, logLevel: 'silent' })

    expect(result.ok).toBe(true)
    expect(result.sourceCount).toBe(1)
    expect(result.summary.tokens.used).toBeGreaterThan(0)
    expect(result.summary.keyframes.used).toBeGreaterThanOrEqual(0)
    expect(result.files).toHaveLength(1)
    expect(result.files[0]).toMatchObject({
      path: expect.stringContaining('App.tsx'),
      counts: { tokens: expect.any(Number), keyframes: expect.any(Number) },
    })
  })

  it('prints the usage summary', async () => {
    dir = createFixture(
      `export default {
        jsxFramework: 'react',
        outdir: 'styled-system',
        include: ['**/*.tsx'],
        importMap: {
          css: ['@panda/css'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        theme: {
          tokens: {
            colors: {
              red: { 500: { value: '#f00' } },
              blue: { 500: { value: '#00f' } },
            },
          },
          recipes: {
            button: {
              jsx: ['Button'],
              base: {},
              variants: {
                size: {
                  sm: { color: 'red.500' },
                  md: { color: 'blue.500' },
                },
              },
            },
          },
        },
        utilities: {
          color: { className: 'c', values: 'colors' },
        },
      }`,
      { source: false },
    )
    writeFileSync(
      join(dir, 'App.tsx'),
      [
        "import { css } from '@panda/css'",
        "import { token } from '@panda/tokens'",
        "import { Button } from '@panda/jsx'",
        "css({ color: token('colors.red.500') })",
        ';<Button size="sm" />',
      ].join('\n'),
    )

    const logs: string[] = []
    const result = await runAnalyze({ cwd: dir }, { log: (message) => logs.push(message) })

    expect(result.ok).toBe(true)
    expect(logs.join('\n')).toMatchInlineSnapshot(`
      "analyze: scanned 1 files

      Summary
      tokens      1 uses, 1 unique
      recipes     1 uses, 1 unique
      utilities   1 uses, 1 unique
      patterns    0 uses, 0 unique
      keyframes   0 uses, 0 unique"
    `)
  })
})
