import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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

  describe('preset install', () => {
    const writePkg = (at: string, manifest: Record<string, unknown> = { name: 'app' }) =>
      writeFileSync(join(at, 'package.json'), JSON.stringify(manifest))

    const initWithPkg = (manifest?: Record<string, unknown>, flags: Record<string, unknown> = {}) => {
      dir = createFixture(undefined, { config: false, source: false })
      writePkg(dir, manifest)
      return runInit({ cwd: dir, codegen: false, silent: true, ...flags })
    }

    it('installs both presets as devDependencies', async () => {
      const result = await initWithPkg({ name: 'app' })

      expect(execSync).toHaveBeenCalledOnce()
      expect(execSync).toHaveBeenCalledWith(
        'npm install -D @pandacss/preset-base @pandacss/preset-panda',
        expect.objectContaining({ cwd: dir, stdio: 'ignore' }),
      )
      expect(result.presetsInstalled).toEqual(['@pandacss/preset-base', '@pandacss/preset-panda'])
    })

    it.each([
      ['pnpm-lock.yaml', 'pnpm add -D'],
      ['yarn.lock', 'yarn add -D'],
      ['bun.lockb', 'bun add -d'],
      ['bun.lock', 'bun add -d'],
      ['package-lock.json', 'npm install -D'],
    ])('detects the package manager from %s', async (lockfile, prefix) => {
      dir = createFixture(undefined, { config: false, source: false })
      writePkg(dir)
      writeFileSync(join(dir, lockfile), '')

      await runInit({ cwd: dir, codegen: false, silent: true })

      expect(execSync).toHaveBeenCalledWith(
        `${prefix} @pandacss/preset-base @pandacss/preset-panda`,
        expect.objectContaining({ cwd: dir }),
      )
    })

    it('defaults to npm when no lockfile is present', async () => {
      await initWithPkg()

      expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/^npm install -D /), expect.anything())
    })

    it('prefers pnpm when multiple lockfiles are present', async () => {
      dir = createFixture(undefined, { config: false, source: false })
      writePkg(dir)
      writeFileSync(join(dir, 'package-lock.json'), '')
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      await runInit({ cwd: dir, codegen: false, silent: true })

      expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/^pnpm add -D /), expect.anything())
    })

    it('walks up to find the lockfile in a monorepo parent', async () => {
      dir = createFixture(undefined, { config: false, source: false })
      const child = join(dir, 'packages', 'app')
      mkdirSync(child, { recursive: true })
      writePkg(child)
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      await runInit({ cwd: child, codegen: false, silent: true })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringMatching(/^pnpm add -D /),
        expect.objectContaining({ cwd: child }),
      )
    })

    it('installs only the missing preset', async () => {
      const result = await initWithPkg({ name: 'app', devDependencies: { '@pandacss/preset-base': '*' } })

      expect(execSync).toHaveBeenCalledWith('npm install -D @pandacss/preset-panda', expect.anything())
      expect(result.presetsInstalled).toEqual(['@pandacss/preset-panda'])
    })

    it('treats presets in dependencies (not just devDependencies) as present', async () => {
      const result = await initWithPkg({
        name: 'app',
        dependencies: { '@pandacss/preset-base': '*', '@pandacss/preset-panda': '*' },
      })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
    })

    it('skips when both presets are already in devDependencies', async () => {
      const result = await initWithPkg({
        name: 'app',
        devDependencies: { '@pandacss/preset-base': '*', '@pandacss/preset-panda': '*' },
      })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
    })

    it('--no-install scaffolds a bare config (presets: []) and installs nothing', async () => {
      const result = await initWithPkg({ name: 'app' }, { install: false })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
      expect(readFileSync(join(dir!, 'panda.config.ts'), 'utf8')).toContain('presets: [],')
    })

    it('reports nothing installed when the install command fails', async () => {
      execSync.mockImplementation(() => {
        throw new Error('install failed')
      })
      const result = await initWithPkg({ name: 'app' })

      expect(execSync).toHaveBeenCalledOnce()
      expect(result.presetsInstalled).toEqual([])
    })

    it('warns on install failure in human mode', async () => {
      execSync.mockImplementation(() => {
        throw new Error('install failed')
      })
      dir = createFixture(undefined, { config: false, source: false })
      writePkg(dir)
      const logs: string[] = []

      await runInit({ cwd: dir, codegen: false }, { log: (message) => logs.push(message) })

      expect(logs.some((line) => line.includes('could not install'))).toBe(true)
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

    it('leaves an unparseable package.json alone without the missing-manifest hint', async () => {
      dir = createFixture(undefined, { config: false, source: false })
      writeFileSync(join(dir, 'package.json'), '{ not valid json')
      const logs: string[] = []

      const result = await runInit({ cwd: dir, codegen: false }, { log: (message) => logs.push(message) })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
      expect(logs.some((line) => line.includes('no package.json found'))).toBe(false)
    })
  })
})
