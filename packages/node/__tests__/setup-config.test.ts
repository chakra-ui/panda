import fsExtra from 'fs-extra'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const formatlyMock = vi.fn()
const lookItUpSyncMock = vi.fn()
const detectMock = vi.fn()

vi.mock('formatly', () => ({
  formatly: formatlyMock,
}))

vi.mock('look-it-up', () => ({
  lookItUpSync: lookItUpSyncMock,
}))

vi.mock('package-manager-detector', () => ({
  detect: detectMock,
}))

describe('setupConfig', () => {
  let cwd: string

  beforeEach(async () => {
    vi.resetModules()
    cwd = await mkdtemp(join(tmpdir(), 'panda-setup-config-'))
    vi.spyOn(fsExtra, 'writeFile').mockResolvedValue(undefined as never)
    formatlyMock.mockResolvedValue({ ran: false })
    lookItUpSyncMock.mockReturnValue(undefined)
    detectMock.mockResolvedValue({ agent: 'pnpm@11.15.1' })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    formatlyMock.mockReset()
    lookItUpSyncMock.mockReset()
    detectMock.mockReset()
    await rm(cwd, { recursive: true, force: true })
  })

  test('writes a panda config file and formats it with the project formatter', async () => {
    const { setupConfig } = await import('../src/setup-config')

    await setupConfig(cwd, { force: true })

    expect(fsExtra.writeFile).toHaveBeenCalledTimes(1)
    expect(fsExtra.writeFile).toHaveBeenCalledWith(
      join(cwd, 'panda.config.mjs'),
      expect.stringContaining('export default defineConfig({'),
    )
    expect(formatlyMock).toHaveBeenCalledWith(['panda.config.mjs'], { cwd })
  })

  test('uses the ts config filename when a tsconfig exists', async () => {
    lookItUpSyncMock.mockReturnValue(join(cwd, 'tsconfig.json'))
    const { setupConfig } = await import('../src/setup-config')

    await setupConfig(cwd, { force: true })

    expect(fsExtra.writeFile).toHaveBeenCalledWith(
      join(cwd, 'panda.config.ts'),
      expect.stringContaining('export default defineConfig({'),
    )
    expect(formatlyMock).toHaveBeenCalledWith(['panda.config.ts'], { cwd })
  })
})
