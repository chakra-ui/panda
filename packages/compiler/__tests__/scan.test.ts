import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCompiler } from '../src'
import { createUserConfig } from './test-utils'

// Exercises the Rust fs engine end-to-end: the native compiler globs + reads
// source files from real disk itself — the JS host passes only `cwd`/`include`.
describe('scan/parseFiles (native fs engine)', () => {
  let dir: string

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'panda-scan-'))
    writeFileSync(join(dir, 'a.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
    mkdirSync(join(dir, 'nested'))
    writeFileSync(join(dir, 'nested', 'b.tsx'), "import { css } from '@panda/css'; css({ color: 'blue' })")
    writeFileSync(join(dir, 'types.d.ts'), 'export const x: number = 1')
  })

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('scan() lists matching files without parsing', () => {
    const compiler = createCompiler(createUserConfig({ cwd: dir, include: ['**/*.{ts,tsx}'] }))
    const files = compiler.scan()

    expect(files).toHaveLength(2)
    expect(files.some((file) => file.endsWith('a.tsx'))).toBe(true)
    expect(files.some((file) => file.endsWith(join('nested', 'b.tsx')))).toBe(true)
    expect(files.some((file) => file.endsWith('types.d.ts'))).toBe(false)
    expect(compiler.summary().filesProcessed).toBe(0)
  })

  it('parseFiles() reads + parses paths returned from scan()', () => {
    const compiler = createCompiler(createUserConfig({ cwd: dir, include: ['**/*.{ts,tsx}'] }))
    const paths = compiler.scan()
    const reports = compiler.parseFiles(paths)

    expect(
      reports
        .map((report) => ({
          ...report,
          path: report.path.replace(`${dir}/`, ''),
        }))
        .sort((a, b) => a.path.localeCompare(b.path)),
    ).toMatchInlineSnapshot(`
      [
        {
          "path": "a.tsx",
          "cssCalls": 1,
          "cvaCalls": 0,
          "svaCalls": 0,
          "jsxUsages": 0,
          "diagnostics": [],
        },
        {
          "path": "nested/b.tsx",
          "cssCalls": 1,
          "cvaCalls": 0,
          "svaCalls": 0,
          "jsxUsages": 0,
          "diagnostics": [],
        },
      ]
    `)
    expect(compiler.summary().filesProcessed).toBe(2)
    const css = compiler.compile().css
    expect(css).toContain('red')
    expect(css).toContain('blue')
  })

  it('respects include overrides passed to parseFiles()', () => {
    const compiler = createCompiler(createUserConfig({ cwd: dir, include: ['**/*.tsx'] }))
    const paths = compiler.scan({ include: ['a.tsx'] })
    const reports = compiler.parseFiles(paths)
    expect(reports.map((report) => ({ ...report, path: report.path.replace(`${dir}/`, '') }))).toMatchInlineSnapshot(`
      [
        {
          "path": "a.tsx",
          "cssCalls": 1,
          "cvaCalls": 0,
          "svaCalls": 0,
          "jsxUsages": 0,
          "diagnostics": [],
        },
      ]
    `)
  })
})
