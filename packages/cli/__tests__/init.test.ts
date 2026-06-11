import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runInit, setupGitIgnore } from '../src'
import { cleanupFixture, createFixture } from './helpers'

describe('init command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
  })

  it('writes a config and updates gitignore by default', async () => {
    dir = createFixture(undefined, { config: false, source: false })

    const result = await runInit({ cwd: dir, codegen: false, silent: true })

    expect(result).toMatchObject({
      ok: true,
      command: 'init',
      configWritten: true,
      gitignoreWritten: true,
      codegenFiles: [],
    })
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain('outdir: "styled-system"')
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain('styled-system')
  })

  it('supports outdir overrides for config and gitignore', async () => {
    dir = createFixture(undefined, { config: false, source: false })

    const result = await runInit({ cwd: dir, outdir: 'system', codegen: false, silent: true })

    expect(result.outdir).toBe('system')
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain('outdir: "system"')
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain('system')
  })

  it('--no-gitignore leaves gitignore untouched', async () => {
    dir = createFixture(undefined, { config: false, source: false })
    writeFileSync(join(dir, '.gitignore'), 'node_modules\n')

    const result = await runInit({ cwd: dir, gitignore: false, codegen: false, silent: true })

    expect(result.gitignoreWritten).toBe(false)
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toBe('node_modules\n')
  })

  it('does not duplicate existing gitignore entries', () => {
    dir = createFixture(undefined, { config: false, source: false })
    writeFileSync(join(dir, '.gitignore'), '# Panda\nstyled-system\n')

    expect(setupGitIgnore(dir)).toBe(false)
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toBe('# Panda\nstyled-system\n')
  })

  it('runs codegen by default', async () => {
    dir = createFixture(undefined, { config: false, source: true })

    const result = await runInit({ cwd: dir, silent: true })

    expect(result.codegenFiles.some((path) => path.endsWith('css/css.js'))).toBe(true)
    expect(existsSync(join(dir, 'styled-system', 'css', 'css.js'))).toBe(true)
  })
})
