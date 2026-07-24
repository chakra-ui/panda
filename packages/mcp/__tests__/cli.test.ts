import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { main } from '../src/cli'

describe('main', () => {
  const dirs: string[] = []

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
    vi.restoreAllMocks()
  })

  test('prints help without starting the server', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await main(['--help'])
    expect(log).toHaveBeenCalled()
    expect(String(log.mock.calls.flat().join('\n'))).toContain('panda-mcp')
  })

  test('init writes npx -y @pandacss/mcp client config', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'panda-mcp-init-'))
    dirs.push(cwd)
    await mkdir(join(cwd, '.cursor'), { recursive: true })

    await main(['init', '--cwd', cwd, '--client', 'cursor'])

    const config = JSON.parse(await readFile(join(cwd, '.cursor/mcp.json'), 'utf8'))
    expect(config).toEqual({
      mcpServers: {
        panda: {
          command: 'npx',
          args: ['-y', '@pandacss/mcp'],
        },
      },
    })
  })

  test('rejects unknown commands', async () => {
    await expect(main(['explode'])).rejects.toThrow('Unknown command: explode')
  })
})
