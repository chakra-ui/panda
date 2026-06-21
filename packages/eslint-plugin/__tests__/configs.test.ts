import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { recommended } from '../src/configs'

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-eslint-configs-'))
  writeFileSync(
    join(dir, 'panda.config.ts'),
    `export default {
      outdir: 'styled-system',
      theme: { tokens: { colors: { red: { 500: { value: '#f00' } } } } },
      utilities: { color: { className: 'c', values: 'colors' } },
    }`,
  )
  return dir
}

describe('configs.recommended', () => {
  const dir = createTempProject()

  test('returns a flat config with @pandacss/* rule ids and severities', async () => {
    const configPath = join(dir, 'panda.config.ts')
    const config = await recommended({ cwd: dir, configPath })

    expect(Object.keys(config.plugins)).toEqual(['@pandacss'])
    expect(config.plugins['@pandacss'].meta.name).toBe('@pandacss/eslint-plugin')
    expect(typeof config.plugins['@pandacss'].meta.version).toBe('string')
    expect(config.files).toEqual(['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'])
    expect(config.rules).toEqual({
      '@pandacss/extraction-diagnostics': 'warn',
      '@pandacss/file-not-included': 'error',
      '@pandacss/no-invalid-token-paths': 'error',
      '@pandacss/no-invalid-nesting': 'error',
      '@pandacss/no-deprecated': 'warn',
      '@pandacss/no-debug': 'warn',
      '@pandacss/prefer-token': ['warn', { categories: ['colors'] }],
    })
    expect(config.settings).toEqual({ panda: { configPath } })
  })

  test('exposes the bound rule modules under the plugin key', async () => {
    const config = await recommended({ cwd: dir })

    expect(Object.keys(config.plugins['@pandacss'].rules)).toEqual([
      'extraction-diagnostics',
      'file-not-included',
      'no-invalid-token-paths',
      'no-invalid-nesting',
      'no-deprecated',
      'no-debug',
      'prefer-token',
      'no-important',
      'no-margin-properties',
      'no-physical-properties',
      'no-shorthand-longhand-mix',
      'consistent-property-style',
      'prefer-text-style',
    ])
  })

  test('omits settings when no configPath is given', async () => {
    const config = await recommended({ cwd: dir })
    expect(config.settings).toBeUndefined()
  })

  test('honours a custom `files` override', async () => {
    const config = await recommended({ cwd: dir, files: ['src/**/*.tsx'] })
    expect(config.files).toEqual(['src/**/*.tsx'])
  })
})
