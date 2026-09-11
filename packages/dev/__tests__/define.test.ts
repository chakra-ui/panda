import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as defineEntry from '@pandacss/dev/define'
import * as rootEntry from '@pandacss/dev'
import { describe, expect, test } from 'vitest'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resolveFromTest = createRequire(import.meta.url).resolve
const tsupCli = path.join(path.dirname(resolveFromTest('tsup/package.json')), 'dist/cli-default.js')

describe('@pandacss/dev/define', () => {
  test('preserves root helper exports', () => {
    expect(defineEntry.definePattern).toBe(rootEntry.definePattern)
    expect(defineEntry.defineTokens).toBe(rootEntry.defineTokens)
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

  test('loads the published entry point built from current source', async () => {
    const temporaryPackage = await mkdtemp(path.join(tmpdir(), 'pandacss-dev-define-'))

    try {
      const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'))

      await writeFile(
        path.join(temporaryPackage, 'package.json'),
        JSON.stringify({
          name: packageJson.name,
          type: packageJson.type,
          exports: { './define': packageJson.exports['./define'] },
        }),
      )

      execFileSync(
        process.execPath,
        [
          tsupCli,
          path.join(packageRoot, 'src/define.ts'),
          '--out-dir',
          path.join(temporaryPackage, 'dist'),
          '--format',
          'esm',
          '--platform',
          'node',
          '--no-splitting',
          '--no-config',
          '--silent',
        ],
        { cwd: packageRoot },
      )

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
        { cwd: temporaryPackage },
      )
    } finally {
      await rm(temporaryPackage, { recursive: true, force: true })
    }
  })
})
