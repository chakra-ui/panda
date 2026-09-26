import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runInit, setupGitIgnore } from '../src'
import { cleanupFixture, createEmptyFixture, createFixture, linkWorkspaceDevPackage } from './helpers'

const { version } = require('../package.json') as { version: string }
const base = `@pandacss/preset-base@${version}`
const panda = `@pandacss/preset-panda@${version}`

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
    dir = createEmptyFixture()
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'app' }))

    const result = await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

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

  it('rejects --interactive with --json', async () => {
    dir = createEmptyFixture()
    const logs: string[] = []
    const result = await runInit(
      { cwd: dir, interactive: true, json: true, codegen: false },
      { log: (message) => logs.push(message), error: (message) => logs.push(message) },
    )

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(2)
    expect(logs.join('\n')).toContain("--interactive can't be used with JSON output")
    expect(existsSync(join(dir, 'panda.config.ts'))).toBe(false)
  })

  it('writes strictTokens when set', async () => {
    dir = createEmptyFixture()
    await runInit({ cwd: dir, codegen: false, logLevel: 'silent', strictTokens: true })
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain('strictTokens: true')
  })

  it('writes jsxStyleProps and outExtension when set', async () => {
    dir = createEmptyFixture()
    await runInit({
      cwd: dir,
      codegen: false,
      logLevel: 'silent',
      jsxFramework: 'react',
      jsxStyleProps: 'minimal',
      outExtension: 'ts',
    })
    const config = readFileSync(join(dir, 'panda.config.ts'), 'utf8')
    expect(config).toContain('jsxFramework: "react"')
    expect(config).toContain('jsxStyleProps: "minimal"')
    expect(config).toContain('outExtension: "ts"')
  })

  it('supports outdir overrides for config and gitignore', async () => {
    dir = createEmptyFixture()

    const result = await runInit({ cwd: dir, outdir: 'system', codegen: false, logLevel: 'silent' })

    expect(result.outdir).toBe('system')
    expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain('outdir: "system"')
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain('system')
  })

  it('--no-gitignore leaves gitignore untouched', async () => {
    dir = createEmptyFixture()
    writeFileSync(join(dir, '.gitignore'), 'node_modules\n')

    const result = await runInit({ cwd: dir, gitignore: false, codegen: false, logLevel: 'silent' })

    expect(result.gitignoreWritten).toBe(false)
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toBe('node_modules\n')
  })

  it('does not duplicate existing gitignore entries', () => {
    dir = createEmptyFixture()
    writeFileSync(join(dir, '.gitignore'), '# Panda\nstyled-system\n')

    expect(setupGitIgnore(dir)).toBe(false)
    expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toBe('# Panda\nstyled-system\n')
  })

  it('runs codegen by default', async () => {
    dir = createFixture(undefined, { config: false })
    linkWorkspaceDevPackage(dir)
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: 'app',
        devDependencies: { '@pandacss/preset-base': '*', '@pandacss/preset-panda': '*' },
      }),
    )

    const result = await runInit({ cwd: dir, logLevel: 'silent' })

    expect(result.codegenFiles.some((path) => path.endsWith('css/css.js'))).toBe(true)
    expect(existsSync(join(dir, 'styled-system', 'css', 'css.js'))).toBe(true)
  })

  describe('preset install', () => {
    const writePkg = (at: string, manifest: Record<string, unknown> = { name: 'app' }) =>
      writeFileSync(join(at, 'package.json'), JSON.stringify(manifest))

    const initWithPkg = (manifest?: Record<string, unknown>, flags: Record<string, unknown> = {}) => {
      dir = createEmptyFixture()
      writePkg(dir, manifest)
      return runInit({ cwd: dir, codegen: false, logLevel: 'silent', ...flags })
    }

    it('installs both presets as devDependencies', async () => {
      const result = await initWithPkg({ name: 'app' })

      expect(execSync).toHaveBeenCalledOnce()
      expect(execSync).toHaveBeenCalledWith(
        `npm install -D ${base} ${panda}`,
        expect.objectContaining({ cwd: dir, stdio: 'ignore' }),
      )
      expect(result.presetsInstalled).toEqual(['@pandacss/preset-base', '@pandacss/preset-panda'])
    })

    it('installs presets with pnpm when the project has a pnpm-lock.yaml', async () => {
      dir = createEmptyFixture()
      writePkg(dir)
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(`pnpm add -D ${base} ${panda}`, expect.objectContaining({ cwd: dir }))
    })

    it('installs presets with yarn when the project has a yarn.lock', async () => {
      dir = createEmptyFixture()
      writePkg(dir)
      writeFileSync(join(dir, 'yarn.lock'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(`yarn add -D ${base} ${panda}`, expect.objectContaining({ cwd: dir }))
    })

    it('installs presets with bun when the project has a binary bun.lockb', async () => {
      dir = createEmptyFixture()
      writePkg(dir)
      writeFileSync(join(dir, 'bun.lockb'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(`bun add -d ${base} ${panda}`, expect.objectContaining({ cwd: dir }))
    })

    it('installs presets with bun when the project has a text bun.lock', async () => {
      dir = createEmptyFixture()
      writePkg(dir)
      writeFileSync(join(dir, 'bun.lock'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(`bun add -d ${base} ${panda}`, expect.objectContaining({ cwd: dir }))
    })

    it('installs presets with npm when the project has a package-lock.json', async () => {
      dir = createEmptyFixture()
      writePkg(dir)
      writeFileSync(join(dir, 'package-lock.json'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(`npm install -D ${base} ${panda}`, expect.objectContaining({ cwd: dir }))
    })

    it('defaults to npm when no lockfile is present', async () => {
      await initWithPkg()

      expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/^npm install -D /), expect.anything())
    })

    it('prefers pnpm when multiple lockfiles are present', async () => {
      dir = createEmptyFixture()
      writePkg(dir)
      writeFileSync(join(dir, 'package-lock.json'), '')
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/^pnpm add -D /), expect.anything())
    })

    it('honors the corepack packageManager field over lockfiles', async () => {
      dir = createEmptyFixture()
      writePkg(dir, { name: 'app', packageManager: 'pnpm@9.1.0' })
      writeFileSync(join(dir, 'package-lock.json'), '')

      await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/^pnpm add -D /), expect.anything())
    })

    it('walks up to find the lockfile in a monorepo parent', async () => {
      dir = createEmptyFixture()
      const child = join(dir, 'packages', 'app')
      mkdirSync(child, { recursive: true })
      writePkg(child)
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      await runInit({ cwd: child, codegen: false, logLevel: 'silent' })

      expect(execSync).toHaveBeenCalledWith(
        expect.stringMatching(/^pnpm add -D /),
        expect.objectContaining({ cwd: child }),
      )
    })

    it('installs only the missing preset', async () => {
      const result = await initWithPkg({ name: 'app', devDependencies: { '@pandacss/preset-base': '*' } })

      expect(execSync).toHaveBeenCalledWith(`npm install -D ${panda}`, expect.anything())
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

    it('--skip-presets scaffolds a bare config and installs nothing', async () => {
      const result = await initWithPkg({ name: 'app' }, { skipPresets: true })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
      expect(readFileSync(join(dir!, 'panda.config.ts'), 'utf8')).toContain('presets: [],')
    })

    it('fails codegen when @pandacss/dev is not installed', async () => {
      dir = createEmptyFixture()
      writePkg(dir)

      const result = await runInit({ cwd: dir, skipPresets: true, logLevel: 'silent' })

      expect(result.ok).toBe(false)
      expect(result.configWritten).toBe(true)
      expect(result.codegenFiles).toEqual([])
      expect(result.diagnostics.some((d) => d.code === 'config_load_error')).toBe(true)
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
      dir = createEmptyFixture()
      writePkg(dir)
      const logs: string[] = []

      await runInit({ cwd: dir, codegen: false }, { log: (message) => logs.push(message) })

      expect(logs.some((line) => line.includes('could not install'))).toBe(true)
    })

    it('scaffolds a bare config and skips install when there is no package.json', async () => {
      dir = createEmptyFixture()

      const result = await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
      expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain('presets: [],')
    })

    it('hints to install presets manually when there is no usable package.json', async () => {
      dir = createEmptyFixture()
      const logs: string[] = []

      await runInit({ cwd: dir, codegen: false }, { log: (message) => logs.push(message) })

      expect(execSync).not.toHaveBeenCalled()
      expect(logs.some((line) => line.includes('no usable package.json'))).toBe(true)
    })

    it('scaffolds a bare config when package.json is unparseable', async () => {
      dir = createEmptyFixture()
      writeFileSync(join(dir, 'package.json'), '{ not valid json')

      const result = await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.presetsInstalled).toEqual([])
      expect(readFileSync(join(dir, 'panda.config.ts'), 'utf8')).toContain('presets: [],')
    })

    it('does not install when re-running init on an existing config', async () => {
      dir = createFixture() // writes panda.config.ts
      writePkg(dir)
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      const result = await runInit({ cwd: dir, codegen: false, logLevel: 'silent' })

      expect(execSync).not.toHaveBeenCalled()
      expect(result.configWritten).toBe(false)
      expect(result.presetsInstalled).toEqual([])
    })

    it('re-scaffolds and installs when --force overwrites an existing config', async () => {
      dir = createFixture() // existing panda.config.ts
      writePkg(dir)
      writeFileSync(join(dir, 'pnpm-lock.yaml'), '')

      const result = await runInit({ cwd: dir, force: true, codegen: false, logLevel: 'silent' })

      expect(result.configWritten).toBe(true)
      expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/^pnpm add -D /), expect.anything())
      expect(result.presetsInstalled).toEqual(['@pandacss/preset-base', '@pandacss/preset-panda'])
    })
  })
})
