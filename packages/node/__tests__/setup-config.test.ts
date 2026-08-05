import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setupConfig } from '../src/setup-config'
import { PandaError } from '@pandacss/shared'
import fsExtra from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'
import { lookItUpSync } from 'look-it-up'

vi.mock('formatly', () => ({
  formatly: vi.fn(),
}))

vi.mock('fs-extra', () => ({
  default: {
    writeFile: vi.fn(),
    pathExists: vi.fn(() => Promise.resolve(false)),
  },
}))

vi.mock('@pandacss/config', () => ({
  findConfig: vi.fn(() => {
    throw new PandaError('CONFIG_NOT_FOUND', 'Config not found')
  }),
}))

vi.mock('look-it-up', () => ({
  lookItUpSync: vi.fn(() => null),
}))

describe('setupConfig', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = join(tmpdir(), `panda-test-${Date.now()}`)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create a config file and format it with formatly', async () => {
    const { formatly } = await import('formatly')

    await setupConfig(tempDir)

    expect(fsExtra.writeFile).toHaveBeenCalled()
    const writeCall = vi.mocked(fsExtra.writeFile).mock.calls[0]
    const [filePath, content] = writeCall

    expect(filePath).toContain('panda.config.mjs')
    expect(content).toContain('defineConfig')
    expect(content).toContain('preflight: true')

    expect(formatly).toHaveBeenCalledWith([filePath], { cwd: tempDir })
  })

  it('should create a .ts config if tsconfig.json exists', async () => {
    vi.mocked(lookItUpSync).mockReturnValue('/path/to/tsconfig.json')

    const { formatly } = await import('formatly')

    await setupConfig(tempDir)

    const writeCall = vi.mocked(fsExtra.writeFile).mock.calls[0]
    const [filePath] = writeCall

    expect(filePath).toContain('panda.config.ts')
    expect(formatly).toHaveBeenCalled()
  })

  it('should include custom options in the config', async () => {
    const { formatly } = await import('formatly')

    await setupConfig(tempDir, {
      jsxFramework: 'react',
      outExtension: 'js',
      outdir: 'my-styled-system',
    })

    const writeCall = vi.mocked(fsExtra.writeFile).mock.calls[0]
    const [, content] = writeCall

    expect(content).toContain("jsxFramework: 'react'")
    expect(content).toContain("outExtension: 'js'")
    expect(content).toContain('outdir: "my-styled-system"')

    expect(formatly).toHaveBeenCalled()
  })
})
