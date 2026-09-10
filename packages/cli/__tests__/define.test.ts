import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as defineEntry from '@pandacss/dev/define'
import * as rootEntry from '@pandacss/dev'
import { describe, expect, test } from 'vitest'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('@pandacss/dev/define', () => {
  test('preserves root helper exports', () => {
    expect(defineEntry.definePattern).toBe(rootEntry.definePattern)
    expect(defineEntry.defineTokens).toBe(rootEntry.defineTokens)

    const defineParts = rootEntry.defineParts({ root: { selector: '&' } })
    expect(defineParts({ root: { color: 'red' } })).toEqual({ '&': { color: 'red' } })
  })

  test('supports flat and namespaced token definitions', () => {
    const flat = { colors: { red: { value: '#f00' } } }
    const colors = { red: { value: '#f00' } }

    expect(defineEntry.defineTokens(flat)).toBe(flat)
    expect(defineEntry.defineTokens.colors(colors)).toBe(colors)
  })

  test('supports flat and namespaced semantic token definitions', () => {
    const flat = { colors: { text: { value: '{colors.gray.900}' } } }
    const colors = { text: { value: '{colors.gray.900}' } }

    expect(defineEntry.defineSemanticTokens(flat)).toBe(flat)
    expect(defineEntry.defineSemanticTokens.colors(colors)).toBe(colors)
  })

  test('loads the published ESM and CommonJS entry points', () => {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          import assert from 'node:assert/strict'
          const { definePattern, defineTokens } = await import('@pandacss/dev/define')
          const pattern = { properties: {} }
          const colors = { red: { value: '#f00' } }
          assert.strictEqual(definePattern(pattern), pattern)
          assert.strictEqual(defineTokens.colors(colors), colors)
        `,
      ],
      { cwd: packageRoot },
    )

    execFileSync(
      process.execPath,
      [
        '--eval',
        `
          const assert = require('node:assert/strict')
          const { definePattern, defineTokens } = require('@pandacss/dev/define')
          const pattern = { properties: {} }
          const colors = { red: { value: '#f00' } }
          assert.strictEqual(definePattern(pattern), pattern)
          assert.strictEqual(defineTokens.colors(colors), colors)
        `,
      ],
      { cwd: packageRoot },
    )
  })
})
