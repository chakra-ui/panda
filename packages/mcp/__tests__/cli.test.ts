import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { main, parseArgs } from '../src/cli'

describe('parseArgs', () => {
  test('parses start flags', () => {
    expect(parseArgs(['--cwd', '/tmp/project', '-c', './panda.config.ts', '--silent'])).toEqual({
      cwd: '/tmp/project',
      config: './panda.config.ts',
      silent: true,
    })
  })

  test('parses init command with clients', () => {
    expect(parseArgs(['init', '--client', 'claude,cursor', '--cwd', '/tmp/project'])).toEqual({
      command: 'init',
      clients: ['claude', 'cursor'],
      cwd: '/tmp/project',
    })
  })

  test('parses help', () => {
    expect(parseArgs(['--help']).help).toBe(true)
    expect(parseArgs(['-h']).help).toBe(true)
  })

  test('rejects unknown options', () => {
    expect(() => parseArgs(['--nope'])).toThrow('Unknown option: --nope')
  })

  test('rejects missing flag values', () => {
    expect(() => parseArgs(['--cwd'])).toThrow('Missing value for --cwd')
  })
})

describe('main', () => {
  const dirs: string[] = []

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
    vi.restoreAllMocks()
  })

  test('prints help without starting the server', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await main(['--help'])
    expect(log).toHaveBeenCalledOnce()
    expect(String(log.mock.calls[0]?.[0])).toContain('panda-mcp')
  })

  test('init writes npx panda mcp client config', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'panda-mcp-init-'))
    dirs.push(cwd)
    await mkdir(join(cwd, '.cursor'), { recursive: true })

    await main(['init', '--cwd', cwd, '--client', 'cursor'])

    const config = JSON.parse(await readFile(join(cwd, '.cursor/mcp.json'), 'utf8'))
    expect(config).toEqual({
      mcpServers: {
        panda: {
          command: 'npx',
          args: ['panda', 'mcp'],
        },
      },
    })
  })

  test('rejects unknown commands', async () => {
    await expect(main(['explode'])).rejects.toThrow('Unknown command: explode')
  })
})
