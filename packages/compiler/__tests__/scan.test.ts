import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCompiler } from '../src'
import { createUserConfig } from './test-utils'

// Exercises the Rust fs engine end-to-end: the native compiler globs + reads
// source files from real disk itself — the JS host passes only `cwd`/`include`.
describe('scan (native fs engine)', () => {
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

  it('globs + reads + parses matching files, honoring the .d.ts default-exclude', () => {
    const compiler = createCompiler(createUserConfig({ cwd: dir, include: ['**/*.{ts,tsx}'] }))
    const report = compiler.scan()

    expect(report.count).toBe(2)
    expect(report.diagnostics).toEqual([])
    expect(compiler.summary().filesProcessed).toBe(2)

    const css = compiler.compile().css
    expect(css).toContain('red')
    expect(css).toContain('blue')
  })

  it('glob() lists matching files without parsing', () => {
    const compiler = createCompiler(createUserConfig({ cwd: dir, include: ['**/*.tsx'] }))
    expect(compiler.glob().length).toBe(2)
    expect(compiler.summary().filesProcessed).toBe(0)
  })

  it('respects include overrides passed to scan()', () => {
    const compiler = createCompiler(createUserConfig({ cwd: dir, include: ['**/*.tsx'] }))
    const report = compiler.scan({ include: ['a.tsx'] })
    expect(report.count).toBe(1)
  })
})
