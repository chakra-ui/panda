import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import { createPandaPlugin } from '../src'
import { Linter } from '../src/core'

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'panda-eslint-plugin-'))
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

describe('createPandaPlugin', () => {
  test('preloads the project once and binds the rules', async () => {
    const dir = createTempProject()
    const linter = new Linter()
    const getProject = vi.spyOn(linter, 'getProject')

    const plugin = await createPandaPlugin({ cwd: dir, linter })

    expect(getProject).toHaveBeenCalledOnce()
    expect(Object.keys(plugin.rules)).toEqual([
      'extraction-diagnostics',
      'file-not-included',
      'no-invalid-token-paths',
      'no-deprecated',
      'no-debug',
      'no-hardcoded-color',
      'no-important',
      'no-margin-properties',
      'no-physical-properties',
      'prefer-text-style',
    ])
  })
})
