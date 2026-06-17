import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runInit, setupGitIgnore } from '../src'
import { cleanupFixture, createFixture, linkWorkspaceDevPackage } from './helpers'

const execSync = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return { ...actual, default: { ...actual, execSync }, execSync }
})

describe('init command', () => {
  let dir: string | undefined

  afterEach(() => {
    cleanupFixture(dir)
    dir = undefined
    execSync.mockReset()
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
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain("import { defineConfig } from '@pandacss/dev'")
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain(
      "presets: ['@pandacss/preset-base', '@pandacss/preset-panda']",
    )
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
    linkWorkspaceDevPackage(dir)

    const result = await runInit({ cwd: dir, silent: true })

    expect(result.codegenFiles.some((path) => path.endsWith('css/css.js'))).toBe(true)
    expect(existsSync(join(dir, 'styled-system', 'css', 'css.js'))).toBe(true)
  })

  it('installs the default presets using the detected package manager', async () => {
    dir = createFixture(undefined, { config: false, source: false })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'app' }))
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

    const result = await runInit({ cwd: dir, codegen: false, silent: true })

    expect(execSync).toHaveBeenCalledOnce()
    expect(execSync).toHaveBeenCalledWith(
      'pnpm add -D @pandacss/preset-base @pandacss/preset-panda',
      expect.objectContaining({ cwd: dir }),
    )
    expect(result.presetsInstalled).toEqual(['@pandacss/preset-base', '@pandacss/preset-panda'])
  })

  it('--no-install scaffolds the config without installing', async () => {
    dir = createFixture(undefined, { config: false, source: false })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'app' }))

    const result = await runInit({ cwd: dir, install: false, codegen: false, silent: true })

    expect(execSync).not.toHaveBeenCalled()
    expect(result.presetsInstalled).toEqual([])
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain(
      "presets: ['@pandacss/preset-base', '@pandacss/preset-panda']",
    )
  })

  it('skips install when there is no package.json', async () => {
    dir = createFixture(undefined, { config: false, source: false })

    const result = await runInit({ cwd: dir, codegen: false, silent: true })

    expect(execSync).not.toHaveBeenCalled()
    expect(result.presetsInstalled).toEqual([])
  })

  it('hints to install presets manually when there is no package.json', async () => {
    dir = createFixture(undefined, { config: false, source: false })
    const logs: string[] = []

    await runInit({ cwd: dir, codegen: false }, { log: (message) => logs.push(message) })

    expect(execSync).not.toHaveBeenCalled()
    expect(logs.some((line) => line.includes('no package.json found'))).toBe(true)
  })

  it('skips presets already present in the manifest', async () => {
    dir = createFixture(undefined, { config: false, source: false })
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'app', devDependencies: { '@pandacss/preset-base': '*', '@pandacss/preset-panda': '*' } }),
    )

    const result = await runInit({ cwd: dir, codegen: false, silent: true })

    expect(execSync).not.toHaveBeenCalled()
    expect(result.presetsInstalled).toEqual([])
  })
})
